import { delay } from './utils'

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
  return Math.max(...[
    document.documentElement.scrollLeft,
    document.body ? document.body.scrollLeft : 0
  ])
}

export const scrollTop = function (document) {
  return Math.max(...[
    document.documentElement.scrollTop,
    document.body ? document.body.scrollTop : 0
  ])
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

export const getElementByXPath = (xpath, $container) => {
  const list = getElementsByXPath(xpath, $container)
  return list && list.length ? list[0] : null
}

export const imageSize = ($img) => {
  const style = getStyle($img)

  return {
    width:  parseInt(style.width),
    height: parseInt(style.height)
  }
}

export const pageX = (clientX, doc = document) => {
  return clientX + scrollLeft(doc)
}

export const pageY = (clientY, doc = document) => {
  return clientY + scrollTop(doc)
}

export const dataUrlFromImageElement = ($img, rect) => {
  const imgStyle  = getStyle($img)
  const width     = parseInt(imgStyle.width, 10)
  const height    = parseInt(imgStyle.height, 10)
  const canvas    = document.createElement('canvas')
  const ctx       = canvas.getContext('2d')

  canvas.width  = rect ? rect.width : width
  canvas.height = rect ? rect.height : height

  const drawImageArgs = !rect ? [0, 0, width, height]
                              : [0, 0, width, height, -1 * rect.x, -1 * rect.y, width, height]

  return new Promise((resolve, reject) => {
    const newImg = new Image()

    // Note: have to add this crossorigin attribute, otherwise there will be an error
    // for exporting data from tainted canvas
    // Also note that it needs be used with chrome.webRquest hack (add cors header)
    // refer to: https://stackoverflow.com/questions/20424279/canvas-todataurl-securityerror/27260385#27260385
    newImg.setAttribute('crossOrigin', '*')
    newImg.onerror  = reject
    newImg.onload   = () => {
      ctx.drawImage(newImg, ...drawImageArgs)
      resolve({
        width,
        height,
        dataUrl: canvas.toDataURL()
      })
    }
    newImg.src = $img.src
  })
}

export const getPPI = () => {
  const $el = document.createElement('div')

  setStyle($el, {
    width: '1in',
    position: 'absolute',
    left: '-9999px',
    top: '-9999px'
  })

  document.body.appendChild($el)
  const width = getComputedStyle($el).width
  $el.remove()

  return parseInt(width, 10)
}

export const bindSelectionEnd = (fn) => {
  const secureTagName     = (node) => typeof node.tagName === 'string' ? node.tagName.toUpperCase() : null
  const isTextAreaOrInput = (node) => ['INPUT', 'TEXTAREA'].indexOf(secureTagName(node)) !== -1
  const handler = (e) => {
    const s = window.getSelection()

    if (s.isCollapsed)  return
    if (isTextAreaOrInput(s.anchorNode) && isTextAreaOrInput(s.focusNode))  return

    fn(e, s)
  }

  document.addEventListener('mouseup', handler)
  return () => document.removeEventListener('mouseup', handler)
}
