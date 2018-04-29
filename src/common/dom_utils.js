export const getStyle = function (dom) {
  if (!dom)   throw new Error('getStyle: dom not exist')
  return getComputedStyle(dom)
}

export const setStyle = function (dom, style) {
  if (!dom)   throw new Error('setStyle: dom not exist')

  for (var i = 0, keys = Object.keys(style), len = keys.length; i < len; i++) {
    dom.style[keys[i]] = style[keys[i]]
  }

  return dom
}

export const pixel = function (num) {
  if ((num + '').indexOf('px') !== -1)  return num
  return (num || 0) + 'px'
}

// Reference: http://ryanve.com/lab/dimensions/
export const clientWidth = function (document) {
  return document.documentElement.clientWidth
}

export const clientHeight = function (document) {
  return document.documentElement.clientHeight
}

export const pageWidth = function (document) {
  const body = document.body
  const widths = [
    document.documentElement.clientWidth,
    document.documentElement.scrollWidth,
    document.documentElement.offsetWidth,
    body ? body.scrollWidth : 0,
    body ? body.offsetWidth : 0
  ]

  return Math.max(...widths)
}

export const pageHeight = function (document) {
  const body = document.body
  const heights = [
    document.documentElement.clientHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight,
    body ? body.scrollHeight : 0,
    body ? body.offsetHeight : 0
  ]

  return Math.max(...heights)
}

export const scrollLeft = function (document) {
  return document.documentElement.scrollLeft
}

export const scrollTop = function (document) {
  return document.documentElement.scrollTop
}

export const offset = function (dom) {
  if (!dom) return { left: 0, top: 0 }

  var rect = dom.getBoundingClientRect()

  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height
  }
}

export const xpath = (dom, cur, list) => {
  var getTagIndex = function (dom) {
    return Array.from(dom.parentNode.childNodes).filter(function (item) {
      return item.nodeType === dom.nodeType && item.tagName === dom.tagName
    }).reduce(function (prev, node, i) {
      if (prev !== null)  return prev
      return node === dom ? (i + 1) : prev
    }, null)
  }

  var getTextNodeIndex = function (textNode) {
    let count = -1
    let found = false

    textNode.parentNode.childNodes.forEach(node => {
      if (found)  return
      if (node.nodeType === 3)  count++
      if (node === textNode)    found = true
    })

    return count
  }

  var name = function (dom) {
    if (!dom)                 return null
    if (dom.nodeType === 3)   return '@text'

    var index = getTagIndex(dom)
    var count = Array.from(dom.parentNode.childNodes).filter(function (item) {
      return item.nodeType === dom.nodeType && item.tagName === dom.tagName
    }).length
    var tag   = dom.tagName.toLowerCase()

    return count > 1 ? (tag + '[' + index + ']') : tag
  }

  var helper = function (dom, cur, list) {
    if (!dom)   return null

    if (!cur) {
      if (dom.nodeType === 3) {
        const textIndex = getTextNodeIndex(dom)
        const str       = 'text()' + (textIndex === 0 ? '' : `[${textIndex + 1}]`)
        return helper(dom, dom.parentNode, [str])
      } else {
        return helper(dom, dom, [])
      }
    }

    if (!cur.parentNode) {
      return ['html'].concat(list)
    }

    if (cur.tagName === 'BODY') {
      return ['html', 'body'].concat(list)
    }

    if (cur.id) {
      return [`*[@id="${cur.id}"]`].concat(list)
    }

    return helper(dom, cur.parentNode, [name(cur)].concat(list))
  }

  var parts   = helper(dom, cur, list)
  var prefix  = parts[0] === 'html' ? '/' : '//'
  var ret     = prefix + parts.join('/')

  return ret
}

export const getElementsByXPath = (xpath, $container) => {
  const snapshot = document.evaluate(
    xpath,
    $container || document.body,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  )
  const res = []

  for (let i = 0, len = snapshot.snapshotLength; i < len; i++) {
    res.push(snapshot.snapshotItem(i))
  }

  return res
}

export const imageSize = ($img) => {
  const style = getStyle($img)

  return {
    width:  parseInt(style.width),
    height: parseInt(style.height)
  }
}
