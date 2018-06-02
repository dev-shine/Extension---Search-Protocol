import throttle from 'lodash.throttle'
import log from './log';

export const delay = (fn, timeout) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn())
      } catch (e) {
        reject(e)
      }
    }, timeout)
  })
}

export const until = (name, check, interval = 1000, expire = 10000) => {
  const start = new Date()
  const go    = () => {
    if (expire && new Date() - start >= expire) {
      throw new Error(`until: ${name} expired!`)
    }

    const { pass, result } = check()

    if (pass) return Promise.resolve(result)
    return delay(go, interval)
  }

  return new Promise((resolve, reject) => {
    try {
      resolve(go())
    } catch (e) {
      reject(e)
    }
  })
}

export const range = (start, end, step = 1) => {
  const ret = []

  for (let i = start; i < end; i += step) {
    ret.push(i)
  }

  return ret
}

export const partial = (fn) => {
  const len = fn.length
  let arbitary

  arbitary = (curArgs, leftArgCnt) => (...args) => {
    if (args.length >= leftArgCnt) {
      return fn.apply(null, curArgs.concat(args))
    }

    return arbitary(curArgs.concat(args), leftArgCnt - args.length)
  }

  return arbitary([], len)
}

export const reduceRight = (fn, initial, list) => {
  var ret = initial

  for (let i = list.length - 1; i >= 0; i--) {
    ret = fn(list[i], ret)
  }

  return ret
}

export const compose = (...args) => {
  return reduceRight((cur, prev) => {
    return x => cur(prev(x))
  }, x => x, args)
}

export const map = partial((fn, list) => {
  var result = []

  for (let i = 0, len = list.length; i < len; i++) {
    result.push(fn(list[i]))
  }

  return result
})

export const on = partial((key, fn, dict) => {
  if (Array.isArray(dict)) {
    return [
      ...dict.slice(0, key),
      fn(dict[key]),
      ...dict.slice(key + 1)
    ]
  }

  return Object.assign({}, dict, {
    [key]: fn(dict[key])
  })
})

export const updateIn = partial((keys, fn, obj) => {
  const updater = compose.apply(null, keys.map(key => on(key)))
  return updater(fn)(obj)
})

export const setIn = partial((keys, value, obj) => {
  const updater = compose.apply(null, keys.map(key => on(key)))
  return updater(() => value)(obj)
})

export const getIn = partial((keys, obj) => {
  return keys.reduce((prev, key) => {
    if (!prev)  return prev
    return prev[key]
  }, obj)
})

export const pick = (keys, obj) => {
  return keys.reduce((prev, key) => {
    prev[key] = obj[key]
    return prev
  }, {})
}

export const unpick = (keys, obj) => {
  return Object.keys(obj).reduce((prev, key) => {
    if (keys.indexOf(key) === -1) {
      prev[key] = obj[key]
    }
    return prev
  }, {})
}

export const uid = () => {
  return '' + (new Date() * 1) + '.' +
         Math.floor(Math.random() * 10000000).toString(16)
}

export const flatten = (list) => {
  return [].concat.apply([], list);
}

export const without = (list1, list2) => {
  return list2.filter(item => list1.indexOf(item) === -1)
}

export const cn = (...list) => {
  return list.reduce((prev, cur) => {
    if (!cur) return prev
    if (typeof cur === 'string') {
      prev.push(cur)
    } else {
      Object.keys(cur).forEach(key => {
        if (cur[key]) prev.push(key)
      })
    }

    return prev
  }, []).join(' ')
}

export const and = (...list) => list.reduce((prev, cur) => prev && cur, true)

export const or = (...list) => list.reduce((prev, cur) => prev || cur, false)

export const objMap = (fn, obj) => {
  return Object.keys(obj).reduce((prev, key, i) => {
    prev[key] = fn(obj[key], key, i, obj)
    return prev
  }, {})
}

export const unique = (list) => {
  const cache   = {}
  const result  = []

  for (let i = 0, len = list.length; i < len; i++) {
    if (!cache[list[i]]) {
      result.push(list[i])
      cache[list[i]] = true
    }
  }

  return result
}

export const normalizeUrl = (url, base) => {
  if (/https?:\/\//.test(url))  return url

  const urlObj = new URL(url, base)
  return urlObj.href
}

export const liveBuild = ({ bindEvent, unbindEvent, getFuse, isEqual, onFuseChange, initial = true }) => {
  let fuse = initial ? getFuse() : null
  let api  = initial ? onFuseChange(fuse) : null

  const listener = throttle(e => {
    const newFuse = getFuse()
    if (isEqual(newFuse, fuse)) return

    fuse  = newFuse
    api   = onFuseChange(fuse, api)
  }, 200)

  bindEvent(listener)

  return {
    getAPI:   () => api,
    destroy:  () => {
      unbindEvent(listener)
    }
  }
}

const fourPointsOfRect = (r) => {
  if (r.x !== undefined && r.left === undefined) {
    r = rectFromXyToLeftTop(r)
  }

  return [
    { x: r.left, y: r.top },
    { x: r.left, y: r.top + r.height },
    { x: r.left + r.width, y: r.top },
    { x: r.left + r.width, y: r.top + r.height }
  ]
}

export const isPointInRect = (x, y, r) => {
  if (r.x !== undefined && r.left === undefined) {
    r = rectFromXyToLeftTop(r)
  }

  return y >= r.top && x >= r.left &&
          (y <= r.top + r.height) &&
          (x <= r.left + r.width)
}

export const isRectsIntersect = (a, b) => {
  const result = or(
    ...fourPointsOfRect(a).map(p => isPointInRect(p.x, p.y, b)),
    ...fourPointsOfRect(b).map(p => isPointInRect(p.x, p.y, a))
  )

  // log('isRectsIntersect', a, b, result)
  return result
}

// Note: rects here are all DOMRect
// will return a list of objects with top, left, width, height
export const reduceRects = (rects) => {
  const area = rect => rect.width * rect.height
  const isIn = (a, b) => {
    return b.top >= a.top && b.left >= a.left &&
            (b.top + b.height <= a.top + a.height) &&
            (b.left + b.width <= a.left + a.width)
  }
  const combineRect = (a, b) => {
    const lt = {
      x: Math.min(a.left, b.left),
      y: Math.min(a.top, b.top)
    }
    const rb = {
      x: Math.max(a.left + a.width, b.left + b.width),
      y: Math.max(a.top + a.height, b.top + b.height)
    }

    return {
      top:    lt.y,
      left:   lt.x,
      width:  rb.x - lt.x,
      height: rb.y - lt.y
    }
  }
  const list = rects.slice()
  list.sort((a, b) => area(b) - area(a))

  // return list

  let result = []

  for (let i = 0, len = list.length; i < len; i++) {
    let cur = list[i]

    for (let j = result.length - 1; j >= 0; j--) {
      if (isRectsIntersect(list[i], result[j])) {
        cur = combineRect(cur, result[j])
        result.splice(j, 1)
      }
    }

    result.push(cur)
  }

  return result
}

// refer to https://stackoverflow.com/questions/12168909/blob-from-dataurl
export function dataURItoBlob (dataURI) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);

  // create a view into the buffer
  var ia = new Uint8Array(ab);

  // set the bytes of the buffer to the correct values
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  var blob = new Blob([ab], {type: mimeString});
  return blob;
}

export const reverseKeyValue = (obj) => {
  return Object.keys(obj).reduce((prev, key) => {
    prev[obj[key]] = key
    return prev
  }, {})
}

export const noop = () => {}

export const TWO_DIMENSION_RELATION = {
  CONTAINS:     'CONTAINS',
  CONTAINED_BY: 'CONTAINED_BY',
  INTERSECT:    'INTERSECT',
  EQUAL:        'EQUAL',
  APART:        'APART'
}

export const twoRangesRelation = (r1, r2) => {
  const list = [
    Range.START_TO_START,
    Range.START_TO_END,
    Range.END_TO_START,
    Range.END_TO_END
  ]
  const results       = list.map(how => r1.compareBoundaryPoints(how, r2))
  const noZeroMulti   = (x, y) => {
    if (x === 0)  return y * y
    if (y === 0)  return x * x
    return x * y
  }

  if ((results[0] === 0 && results[3] === 0) ||
      (results[1] === 0 && results[2] === 0)) {
    return TWO_DIMENSION_RELATION.EQUAL
  }

  const r1StartsInR2  = results[0] * results[1] <= 0
  const r1EndsInR2    = results[2] * results[3] <= 0

  if (r1StartsInR2 && r1EndsInR2) {
    return TWO_DIMENSION_RELATION.CONTAINED_BY
  }

  const r2StartsInR1  = results[0] * results[2] <= 0
  const r2EndsInR1    = results[1] * results[3] <= 0

  if (r2StartsInR1 && r2EndsInR1) {
    return TWO_DIMENSION_RELATION.CONTAINS
  }

  if (noZeroMulti(results[0], results[1]) === noZeroMulti(results[2], results[3])) {
    return TWO_DIMENSION_RELATION.APART
  }

  return TWO_DIMENSION_RELATION.INTERSECT
}

export const isTwoRangesIntersecting = (r1, r2) => {
  return twoRangesRelation(r1, r2) === TWO_DIMENSION_RELATION.INTERSECT
}

export const rectFromXyToLeftTop = (r) => {
  return {
    left:   r.x,
    top:    r.y,
    width:  r.width,
    height: r.height
  }
}

export const rectFromLeftTopToXy = (r) => {
  return {
    x:      r.left,
    y:      r.top,
    width:  r.width,
    height: r.height
  }
}

export const twoRectsRelation = (r1, r2) => {
  if (and(...['x', 'y', 'width', 'height'].map(key => r1[key] === r2[key]))) {
    return TWO_DIMENSION_RELATION.EQUAL
  }

  const r1PointsInR2 = fourPointsOfRect(r1).map(p => isPointInRect(p.x, p.y, r2))
  const r2PointsInR1 = fourPointsOfRect(r2).map(p => isPointInRect(p.x, p.y, r1))

  const r1Count = r1PointsInR2.filter(x => x).length
  const r2Count = r2PointsInR1.filter(x => x).length

  if (r1Count === 0 && r2Count === 4) {
    return TWO_DIMENSION_RELATION.CONTAINS
  }

  if (r1Count === 4 && r2Count === 0) {
    return TWO_DIMENSION_RELATION.CONTAINED_BY
  }

  if (r1Count === 0 && r2Count === 0) {
    return TWO_DIMENSION_RELATION.APART
  }

  return TWO_DIMENSION_RELATION.INTERSECT
}

export const isTwoRectsIntersecting = (r1, r2) => {
  return twoRectsRelation(r1, r2) === TWO_DIMENSION_RELATION.INTERSECT
}

export const isLatinCharacter = (c) => {
  if (!c) return false

  const charCode = c.charCodeAt(0)

  // reference: https://cs.stanford.edu/~miles/iso8859.html
  return (charCode >= 48 && charCode <= 57) ||
          (charCode >= 65 && charCode <= 90) ||
          (charCode >= 97 && charCode <= 122) ||
          (charCode >= 192 && charCode <= 255)
}
