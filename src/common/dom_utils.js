
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
