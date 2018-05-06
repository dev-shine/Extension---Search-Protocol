import throttle from 'lodash.throttle'

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

// Note: rects here are all DOMRect
// will return a list of objects with top, left, width, height
export const reduceRects = (rects) => {
  const area = rect => rect.width * rect.height
  const isIn = (a, b) => {
    return b.top >= a.top && b.left >= a.left &&
            (b.top + b.height <= a.top + a.height) &&
            (b.left + b.width <= a.left + a.width)
  }
  const isPointInRect = (x, y, r) => {
    return y >= r.top && x >= r.left &&
            (y <= r.top + r.height) &&
            (x <= r.left + r.width)
  }
  const fourPointsOfRect = (r) => {
    return [
      { x: r.left, y: r.top },
      { x: r.left, y: r.top + r.height },
      { x: r.left + r.width, y: r.top },
      { x: r.left + r.width, y: r.top + r.height }
    ]
  }
  const isIntersect = (a, b) => {
    return or(
      ...fourPointsOfRect(a).map(p => isPointInRect(p.x, p.y, b)),
      ...fourPointsOfRect(b).map(p => isPointInRect(p.x, p.y, a))
    )
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
      if (isIntersect(list[i], result[j])) {
        cur = combineRect(cur, result[j])
        result.splice(j, 1)
      }
    }

    result.push(cur)
  }

  return result
}
