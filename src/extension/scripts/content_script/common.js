import * as C from '../../../common/constant'
import Ext from 'ext'
import {
  reduceRects, normalizeUrl, objMap, uid, or,
  setIn, isTwoRangesIntersecting, isLatinCharacter
} from '../../../common/utils'
import {
  setStyle, scrollLeft, scrollTop,
  clientWidth, clientHeight,
  pixel, xpath, imageSize,
  dataUrlFromImageElement,
  pageX, pageY, bindSelectionEnd
} from '../../../common/dom_utils'
import { Box, getAnchorRects, BOX_ANCHOR_POS } from '../../../common/shapes/box'
import { isPointInRange, selectionToJSON, parseRangeJSON } from '../../../common/selection'
import { createIframe } from '../../../common/ipc/cs_postmessage'
import { ELEMENT_TYPE, isElementEqual } from '../../../common/models/element_model'
import { LOCAL_BRIDGE_STATUS, EDIT_BRIDGE_TARGET } from '../../../common/models/local_model'
import API from 'cs_api'
import log from '../../../common/log'
import { showHyperLinkBadge, showLinks } from './show_bridges'
import i18n from '../../../i18n'
import config from '../../../config'
import { MouseReveal } from './mouse_reveal'

export const commonStyle = {
  'box-sizing':  'border-box',
  'font-family': 'Arial'
}

export const createEl = ({ tag = 'div', attrs = {}, style = {}, text }) => {
  const $el = document.createElement(tag)

  Object.keys(attrs).forEach(key => {
    $el.setAttribute(key, attrs[key])
  })

  if (text && text.length) {
    $el.innerText = text
  }

  setStyle($el, style)
  return $el
}

export const createRect = (opts) => {
  const containerStyle = {
    ...commonStyle,
    position: 'absolute',
    'z-index':   100000,
    top:      pixel(opts.top),
    left:     pixel(opts.left),
    width:    pixel(opts.width),
    height:   pixel(opts.height),
    ...(opts.containerStyle || {})
  }
  const rectStyle = {
    ...commonStyle,
    width:    '100%',
    height:   '100%',
    border:   `${opts.rectBorderWidth}px solid rgb(239, 93, 143)`,
    cursor:   'move',
    background: 'transparent',
    ...(opts.rectStyle || {})
  }

  const $container = createEl({ style: containerStyle })
  const $rectangle = createEl({ style: rectStyle })

  $container.appendChild($rectangle)
  document.body.appendChild($container)

  return {
    $container,
    $rectangle,
    destroy: () => {
      $container.remove()
    },
    hide: () => {
      setStyle($container, { display: 'none' })
    }
  }
}

export const getAnchorStyle = ({ anchorPos, anchorWidth }) => {
  const cursor = (function () {
    switch (anchorPos) {
      case BOX_ANCHOR_POS.TOP_LEFT:
      case BOX_ANCHOR_POS.BOTTOM_RIGHT:
        return 'nwse-resize'

      case BOX_ANCHOR_POS.TOP_RIGHT:
      case BOX_ANCHOR_POS.BOTTOM_LEFT:
        return 'nesw-resize'
    }
  })()
  const eachStyle = (function () {
    switch (anchorPos) {
      case BOX_ANCHOR_POS.TOP_LEFT:
        return {
          top:    pixel(-1 * anchorWidth / 2),
          left:   pixel(-1 * anchorWidth / 2)
        }
      case BOX_ANCHOR_POS.BOTTOM_RIGHT:
        return {
          bottom: pixel(-1 * anchorWidth / 2),
          right:  pixel(-1 * anchorWidth / 2)
        }

      case BOX_ANCHOR_POS.TOP_RIGHT:
        return {
          top:    pixel(-1 * anchorWidth / 2),
          right:  pixel(-1 * anchorWidth / 2)
        }

      case BOX_ANCHOR_POS.BOTTOM_LEFT:
        return {
          bottom: pixel(-1 * anchorWidth / 2),
          left:   pixel(-1 * anchorWidth / 2)
        }
    }
  })()

  return {
    ...eachStyle,
    cursor
  }
}

export const createButtons = (btns, { groupStyle = {} } = {}) => {
  const buttonStyle = {
    ...commonStyle,
    margin:   '0 10px 0 0',
    padding:  '6px',
    width:    '80px',
    border:   '1px solid #EF5D8F',
    'border-radius': '2px',
    'font-size': '12px',
    color:    '#fff',
    'background-color': '#EF5D8F',
    cursor:   'pointer'
  }
  const $buttons = btns.map((btn, i) => {
    const $dom = createEl({
      tag:    'button',
      text:   btn.text,
      style:  {
        ...buttonStyle,
        ...(btn.style || {}),
        ...(i === btns.length - 1 ? { marginRight: 0 } : {})
      }
    })

    $dom.addEventListener('click', btn.onClick)

    return {
      $dom,
      destroy: () => {
        $dom.removeEventListener('click', btn.onClick)
        $dom.remove()
      }
    }
  })
  const $group = createEl({ style: groupStyle })

  $buttons.forEach(item => $group.appendChild(item.$dom))

  return {
    $buttons,
    $group,
    destroy: () => {
      $buttons.forEach(item => item.destroy())
      $group.remove()
    }
  }
}

export const createSelectionBox = (options = {}) => {
  // Note: options
  const rectBorderWidth   = 3
  const anchorBorderWidth = 2
  const anchorWidth       = 14
  const width   = options.width || 300
  const height  = options.height || 300
  const opts = {
    top:  scrollTop(document) + (clientHeight(document) - height) / 2,
    left: scrollLeft(document) + (clientWidth(document) - width) / 2,
    ...options,
    width,
    height
  }

  // Note: initialize box instance
  let boxRect = {
    x:      opts.left,
    y:      opts.top,
    width:  opts.width,
    height: opts.height
  }
  const box = new Box({
    ...boxRect,
    onStateChange: ({ rect }) => {
      log('onStateChange', rect)
      boxRect = rect
      rectAPI.updatePos(rect)
    }
  })

  // Note: rect object
  const rectObj = createRect({
    ...opts,
    rectBorderWidth
  })
  const unbindDragRect = bindDrag({
    $el: rectObj.$rectangle,
    onDragStart: (e) => {
      box.moveBoxStart()
    },
    onDragEnd: (e, delta) => {
      box.moveBoxEnd()
    },
    onDrag: (e, delta) => {
      box.moveBox({
        dx: delta.dx,
        dy: delta.dy
      })
    }
  })

  // Note: anchors
  const anchorStyle = {
    ...commonStyle,
    position: 'absolute',
    width:    pixel(anchorWidth),
    height:   pixel(anchorWidth),
    border:   `${anchorBorderWidth}px solid #666`,
    background: '#fff'
  }

  const $anchors   = getAnchorRects({
    size: anchorWidth / 2,
    rect: {
      x: 0,
      y: 0,
      width: opts.width,
      height: opts.height
    }
  })
  .map(({ rect, anchorPos }) => {
    const eachStyle = getAnchorStyle({ anchorPos, anchorWidth })
    const $dom      = createEl({
      style: {
        ...anchorStyle,
        ...eachStyle,
        width:    pixel(anchorWidth),
        height:   pixel(anchorWidth)
      }
    })
    const unbindDrag = bindDrag({
      $el: $dom,
      onDragStart: (e) => {
        box.moveAnchorStart({ anchorPos })
      },
      onDragEnd: (e, delta) => {
        box.moveAnchorEnd()
      },
      onDrag: (e, delta) => {
        box.moveAnchor({ x: e.pageX, y: e.pageY })
      }
    })

    return {
      $dom,
      anchorPos,
      destroy: () => {
        unbindDrag()
        $dom.remove()
      }
    }
  })

  $anchors.forEach(item => rectObj.$container.appendChild(item.$dom))

  // Note: render buttons
  const actionsObj = createButtons([
    {
      text: 'Select',
      onClick: (e) => {
        options.onFinish({ rectAPI, boxRect })
      }
    },
    {
      text: 'Cancel',
      style: {
        backgroundColor: 'red',
        borderColor: 'red'
      },
      onClick: (e) => {
        rectAPI.destroy()
      }
    }
  ], {
    groupStyle: {
      ...commonStyle,
      position: 'absolute',
      left:     '50%',
      bottom:   '-55px',
      minWidth: '170px',
      height:   '50px',
      transform: 'translateX(-50%)'
    }
  })

  rectObj.$container.appendChild(actionsObj.$group)

  // Note: final API
  const rectAPI = {
    updatePos: (rect) => {
      setStyle(rectObj.$container, {
        top:    pixel(rect.y),
        left:   pixel(rect.x),
        width:  pixel(rect.width),
        height: pixel(rect.height)
      })
    },
    destroy: () => {
      unbindDragRect()
      actionsObj.destroy()
      $anchors.forEach(item => item.destroy())
      rectObj.destroy()
    },
    hide: () => {
      rectObj.hide()
    }
  }

  return rectAPI
}

export const bindDrag = ({ onDragStart, onDragEnd, onDrag, $el, doc = document }) => {
  let isDragging = false
  let startPos = { x: 0, y: 0 }

  const onMouseDown = (e) => {
    isDragging = true
    startPos = { x: e.screenX, y: e.screenY }
    onDragStart(e)
  }
  const onMouseUp = (e) => {
    if (!isDragging)  return
    isDragging = false
    const dx = e.screenX - startPos.x
    const dy = e.screenY - startPos.y
    onDragEnd(e, { dx, dy })
  }
  const onMouseMove = (e) => {
    if (!isDragging)  return

    const dx = e.screenX - startPos.x
    const dy = e.screenY - startPos.y
    onDrag(e, { dx, dy })

    e.preventDefault()
    e.stopPropagation()
  }

  doc.addEventListener('mousemove', onMouseMove)
  doc.addEventListener('mouseup', onMouseUp)
  $el.addEventListener('mousedown', onMouseDown)

  return () => {
    doc.removeEventListener('mousemove', onMouseMove)
    doc.removeEventListener('mouseup', onMouseUp)
    $el.removeEventListener('mousedown', onMouseDown)
  }
}

export const bindHoverAndClick = ({ onMouseOver, onMouseOut, onClick, $el }) => {
  $el.addEventListener('mouseover', onMouseOver)
  $el.addEventListener('mouseout', onMouseOut)
  $el.addEventListener('click', onClick)

  return () => {
    $el.removeEventListener('mouseover', onMouseOver)
    $el.removeEventListener('mouseout', onMouseOut)
    $el.removeEventListener('click', onClick)
  }
}

export const createOverlayForRange = ({ range, ...rest }) => {
  const rects = Array.from(range.getClientRects())
  return createOverlayForRects({ rects, ...rest })
}

export const createOverlayForRects = ({ rects, color = '#EF5D8F', opacity = 0.4 }) => {
  const $root = createEl({})
  const sx    = scrollLeft(document)
  const sy    = scrollTop(document)

// log('createOverlayForRange rects', rects, sx, sy)

  const $overlays = reduceRects(rects).map(rect => {
    const $dom = createEl({
      style: {
        opacity,
        backgroundColor:  color,
        position:         'absolute',
        'z-index':           100000,
        top:              pixel(rect.top + sy),
        left:             pixel(rect.left + sx),
        width:            pixel(Math.abs(rect.width)),
        height:           pixel(Math.abs(rect.height)),
        pointerEvents:    'none'
      }
    })

    return {
      $dom,
      destroy: () => $dom.remove()
    }
  })

  $overlays.forEach(item => $root.appendChild(item.$dom))
  document.body.appendChild($root)

  const api = {
    $container: $root,
    destroy: () => {
      $overlays.forEach(item => item.destroy())
      $root.remove()
    },
    hide: () => {
      setStyle($root, { display: 'none' })
      return api
    },
    show: () => {
      setStyle($root, { display: 'block' })
      return api
    },
    setStyle: (style) => {
      $overlays.forEach(item => setStyle(item.$dom, style))
      return api
    },
    setColor: (color) => {
      api.setStyle({ backgroundColor: color })
      return api
    }
  }

  return api
}

export const renderContextMenus = (menuOptions, eventData) => {
  const {
    menus,
    hoverStyle,
    normalStyle,
    containerStyle = {},
    onMouseOver = () => {},
    onMouseOut  = () => {}
  } = menuOptions

  const menuStyle = {
    ...commonStyle,
    ...containerStyle,
    position: 'absolute',
    'z-index': 100000,
    x: 0,
    y: 0
  }
  const menuItemStyle = {
    ...commonStyle,
    ...normalStyle
  }
  const $menu = createEl({ style: menuStyle })
  const $menuList = menus(eventData).map(menu => {
    const $dom = createEl({
      text:  menu.text,
      style: menuItemStyle
    })
    const unbind = bindHoverAndClick({
      $el: $dom,
      onMouseOver: (e) => {
        setStyle($dom, hoverStyle)
        onMouseOver(e)
      },
      onMouseOut: (e) => {
        setStyle($dom, normalStyle)
        onMouseOut(e)
      },
      onClick: (e) => {
        if (menu.onClick) {
          menu.onClick(e, eventData)
        }
        api.destroy()
      }
    })

    return {
      $dom,
      destroy: () => {
        unbind()
        $dom.remove()
      }
    }
  })

  const onClickWholeMenu = (e) => {
    e.stopPropagation()
  }
  const onClickDoc = (e) => {
    api.hide()
  }

  $menu.addEventListener('click', onClickWholeMenu)
  document.addEventListener('click', onClickDoc)

  $menuList.forEach(item => $menu.appendChild(item.$dom))
  document.body.appendChild($menu)

  const actualStyle = getComputedStyle($menu)
  const api = {
    $container: $menu,
    width:      parseInt(actualStyle.width),
    height:     parseInt(actualStyle.height),
    show: () => {
      setStyle($menu, { display: 'block' })
    },
    hide: () => {
      setStyle($menu, { display: 'none' })
    },
    destroy: () => {
      $menuList.forEach(item => item.destroy())
      $menu.remove()
    }
  }

  return api
}

export const showContextMenus = (function () {
  let cache = {}

  return ({ menuOptions, eventData, pos, clear = false }) => {
    if (clear) {
      Object.keys(cache).forEach(key => cache[key].destroy())
      cache = {}
      return
    }

    const { id } = menuOptions
    // let menuObj = cache[id]
    let menuObj = null

    if (!menuObj) {
      menuObj   = renderContextMenus(menuOptions, eventData)
      cache[id] = menuObj
    }

    const { width, height } = menuOptions
    const positionStyle     = rightPosition({
      size:   { width, height },
      cursor: typeof pos === 'function' ? pos(menuObj) : pos
    })

    setStyle(menuObj.$container, positionStyle)
    menuObj.show()

    return menuObj
  }
})()

export const rightPosition = ({ size, cursor }) => {
  const rw  = size.width
  const rh  = size.height
  const sx  = scrollLeft(document)
  const sy  = scrollTop(document)
  const w   = clientWidth(document)
  const h   = clientHeight(document)
  const x   = cursor.x - sx
  const y   = cursor.y - sy

  const left = x + rw > w ? (x - rw) : x
  const top  = y + rh > h ? (y - rh) : y

  log('rightPosition', left + sx, top + sy, size, cursor)

  return {
    left: pixel(left + sx),
    top:  pixel(top + sy)
  }
}

export const createContextMenus = ({
  menusOnSelection,
  menusOnImage,
  isSelectionRangeValid,
  isImageValid,
  processLinkData
}) => {
  const isOnSelection = (e) => {
    const s = window.getSelection()
    if (s.isCollapsed)  return false

    const r = s.getRangeAt(0)
    const p = { x: e.pageX, y: e.pageY }

    return isPointInRange(p, r) && isSelectionRangeValid(r)
  }
  const isOnImage = (e) => {
    const dom = e.target
    return dom.tagName && dom.tagName.toLowerCase() === 'img' && isImageValid(dom)
  }
  const onContextMenu = (e) => {
    showContextMenus({ clear: true })

    const pos = {
      x: e.pageX,
      y: e.pageY
    }

    if (isOnImage(e)) {
      e.preventDefault()

      return dataUrlOfImage(e.target)
      .then(({ dataUrl }) => {
        const size = imageSize(e.target)

        return showContextMenus({
          pos,
          menuOptions: menusOnImage,
          eventData: {
            $img: e.target,
            linkData: processLinkData({
              type:     ELEMENT_TYPE.IMAGE,
              url:      window.location.href,
              locator:  xpath(e.target),
              rect: {
                x: 0,
                y: 0,
                ...size
              },
              imageSize: size,
              image: dataUrl
            })
          }
        })
      })
    }

    if (isOnSelection(e)) {
      e.preventDefault()
      return showContextMenus({
        pos,
        menuOptions: menusOnSelection,
        eventData: {
          linkData: processLinkData({
            type: ELEMENT_TYPE.SELECTION,
            url:  window.location.href,
            ...selectionToJSON(window.getSelection())
          })
        }
      })
    }
  }

  document.addEventListener('contextmenu', onContextMenu)

  return {
    destroy: () => {
      document.removeEventListener('contextmenu', onContextMenu)
      showContextMenus({ clear: false })
    }
  }
}

export const createIframeWithMask = (function () {
  let curZIndex = 110000

  return (...args) => {
    const iframeAPI = createIframe(...args)
    const $mask = createEl({
      style: {
        position: 'fixed',
        'z-index': curZIndex,
        'background-color': 'rgba(0, 0, 0, 0.25)',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }
    })

    document.body.appendChild($mask)

    setStyle(iframeAPI.$iframe, {
      'z-index':     curZIndex + 1
    })

    curZIndex += 2

    const newAPI = {
      ...iframeAPI,
      destroy: () => {
        $mask.remove()
        iframeAPI.destroy()
      }
    }

    return newAPI
  }
})()

export const dataUrlOfImage = ($img) => {
  const p = /^http/.test($img.src)
                ? API.hackHeader({
                    url: $img.src,
                    headers: {
                      'Access-Control-Allow-Origin': '*'
                    }
                  })
                : Promise.resolve()

  return p.then(() => dataUrlFromImageElement($img))
}

export const notify = (text) => {
  alert(text)
}

export const submenuEffect = ({ main, sub }) => {
  let createWeakOffSwitch = ({ onSwitchOn, onSwitchOff, waitOff = 300 }) => {
    let timer
    let status

    return {
      on: () => {
        if (status === 1) return

        status = 1
        clearTimeout(timer)
        onSwitchOn()
      },
      off: () => {
        if (status === 0) return

        status = 0
        clearTimeout(timer)
        timer = setTimeout(onSwitchOff, waitOff)
      },
      destroy: () => {
        clearTimeout(timer)
      }
    }
  }

  let lastUnBindSub

  const controller = createWeakOffSwitch({
    onSwitchOn: () => {
      const rect = main.getRect()

      sub.showAround({ rect })
      log('switch on', rect)

      lastUnBindSub = bindHoverAndClick({
        $el: sub.getContainer(),
        onMouseOver: () => {
          controller.on()
        },
        onMouseOut: () => {
          controller.off()
        },
        onClick: () => {}
      })
    },
    onSwitchOff: () => {
      log('switch off')
      if (lastUnBindSub) lastUnBindSub()
      sub.destroy()
    }
  })

  const unbindMain = bindHoverAndClick({
    $el: main.getContainer(),
    onMouseOver: () => {
      controller.on()
    },
    onMouseOut: () => {
      controller.off()
    },
    onClick: () => {}
  })

  return () => {
    unbindMain()
    controller.destroy()
  }
}

export const insertStyle = (css, id) => {
  const $existed = document.getElementById(id)
  if ($existed) return $existed

  const $head  = document.head || document.getElementsByTagName('head')[0]
  const $style = document.createElement('style')

  $style.type = 'text/css'
  $style.id   = id

  if ($style.styleSheet) {
    $style.styleSheet.cssText = css
  } else {
    $style.appendChild(document.createTextNode(css))
  }

  $head.appendChild($style)
  return $style
}

export const showMessage = (text, options = {}) => {
  const css = `
    #__message_container__ {
      pointer-events: none;
      position: fixed;
      z-index: 99999;
      top: 30px;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .__message__ {
      position: relative;
      margin-bottom: 15px;
      padding: 5px 15px;
      border-radius: 4px;
      background-color: rgba(239, 93, 143);
      color: #fff;
      font-family: Arial;
      font-size: 14px;
      transition-timing-function: ease;
      transition: all 0.3s;
    }

    .__message__.__before__ {
      transform: translateY(100%);
      opacity: 0;
    }

    .__message__.__after__ {
      transform: translateY(-100%);
      opacity: 0;
    }
  `
  const containerId   = '__message_container__'
  const getContainer  = () => {
    const $existed    = document.getElementById(containerId)
    if ($existed) return $existed

    const $container  = createEl({
      attrs: {
        id: containerId
      }
    })
    document.body.appendChild($container)

    return $container
  }
  const createMessage = (text, duration) => {
    const animationDuration = 300
    const $msg = createEl({ text, attrs: {'class': '__message__ __before__'} })
    getContainer().appendChild($msg)

    setTimeout(() => {
      $msg.classList.remove('__before__')
    }, 50)

    setTimeout(() => {
      $msg.classList.add('__after__')
      setTimeout(() => {
        $msg.remove()
      }, animationDuration)
    }, duration + animationDuration)
  }

  insertStyle(css, '__message_style__')
  createMessage(text, 2000)
}

export const upsertRelation = ({ onSuccess = () => {} }) => {
  const iframeAPI = createIframeWithMask({
    url:    Ext.extension.getURL('upsert_relation.html'),
    width:  500,
    height: 300,
    onAsk:  (cmd, args) => {
      switch (cmd) {
        case 'CLOSE_UPSERT_RELATION':
          iframeAPI.destroy()
          return true

        case 'DONE_UPSERT_RELATION': {
          onSuccess(args)
          return true
        }
      }
    }
  })

  setStyle(iframeAPI.$iframe, {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    border: '1px solid #ccc'
  })
}

export const showMsgAfterCreateBridge = () => {
  return API.getUserSettings()
  .then(settings => {
    if (settings.hideAfterCreateMsg)  return true

    const iframeAPI = createIframeWithMask({
      url:    Ext.extension.getURL('after_create_bridge.html'),
      width:  500,
      height: 300,
      onAsk:  (cmd, args) => {
        switch (cmd) {
          case 'CLOSE':
            iframeAPI.destroy()
            return true
        }
      }
    })

    setStyle(iframeAPI.$iframe, {
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      border: '1px solid #ccc'
    })
  })
}

export const buildBridge = ({
  bridgeData = {},
  linkPair,
  onSuccess,
  mode = C.UPSERT_MODE.ADD } = {}
) => {
  API.loadRelations()
  .then(relations => {
    const iframeAPI = createIframeWithMask({
      url:    Ext.extension.getURL('build_bridge.html'),
      width:  630,
      height: 600,
      onAsk: (cmd, args) => {
        switch (cmd) {
          case 'INIT':
            return {
              mode,
              bridgeData,
              linkPair,
              relations
            }

          case 'DONE':
            onSuccess(args)
            return true

          case 'CLOSE':
            iframeAPI.destroy()
            return true

          case 'ADD_RELATION':
            upsertRelation({
              onSuccess: ({ relation }) => {
                iframeAPI.ask('SELECT_NEW_RELATION', { relation })
              }
            })
            return true
        }
      }
    })

    setStyle(iframeAPI.$iframe, {
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      border: '1px solid #ccc'
    })
  })
}

export const showHyperLinkBadges = () => {
  const pageUrl = window.location.href
  const $links  = Array.from(document.getElementsByTagName('a'))
  const urlsObj = $links.reduce((prev, $el) => {
    const url = normalizeUrl($el.getAttribute('href'), window.location.href)
    if (!/https?/.test(url) || url === pageUrl)  return prev

    prev[url] = prev[url] || []
    prev[url].push($el)
    return prev
  }, {})
  const urls    = Object.keys(urlsObj)
  if (pageUrl.indexOf('demo.bridgit.io') > -1) {
    return
  }
  API.annotationsAndBridgesByUrls(urls)
  .then(result => {
    objMap((data, url) => {
      const count = data.bridges.length + data.annotations.length
      if (count === 0)  return

      return urlsObj[url].map($el => {
        return showHyperLinkBadge({
          $el,
          url,
          totalCount: '' + count
        })
      })
    }, result)
  })
  .catch(e => log.error(e.stack))
}

export const selectImageArea = ({ $img, linkData, getCurrentPage, showContentElements }) => {
  log('selectImageArea', linkData)
  const extraWidth  = 40
  const extraHeight = 130
  const minWidth    = 500
  const showIframe  = ({ width, height, dataUrl }) => {
    const onAsk = (cmd, args) => {
      switch (cmd) {
        case 'INIT': {
          const {
            elements = [],
            bridges  = [],
            annotations = []
          } = getCurrentPage()
          const imageElements       = elements.filter(item => {
            if (item.type !== ELEMENT_TYPE.IMAGE) return false

            const bridgeCount       = bridges.filter(a => a.from === item.id || a.to === item.id).length
            const annotationCount   = annotations.filter(a => a.target === item.id).length
            if (bridgeCount + annotationCount === 0)  return false

            return true
          })
          const existingImageAreas  = imageElements.filter(item => {
            if (item.locator !== linkData.locator) {
              return false
            }

            const { rect, imageSize } = item
            if (rect.x === 0 && rect.y === 0 &&
                rect.width === imageSize.width &&
                rect.height === imageSize.height) {
              return false
            }

            return true
          })

          log('existing image areas', existingImageAreas)
          return API.getLocalBridgeStatus()
          .then(linkPair => {
            return {
              linkPair,
              linkData,
              dataUrl,
              width,
              height,
              existingImageAreas
            }
          })
        }

        case 'ANNOTATE':
          iframeAPI.destroy()
          annotate({
            linkData:   args.linkData,
            onSuccess:  showContentElements
          })
          return true

        case 'CREATE_BRIDGE': {
          iframeAPI.destroy()

          API.createLocalBridge(args.linkData)
          .then(showMsgAfterCreateBridge)
          .catch(e => log.error(e.stack))

          return true
        }

        case 'BUILD_BRIDGE': {
          iframeAPI.destroy()

          API.buildLocalBridge(args.linkData)
          .then(() => buildBridge({
            mode:       C.UPSERT_MODE.ADD,
            onSuccess:  showContentElements
          }))
          .catch(e => log.error(e.stack))

          return true
        }

        case 'UPDATE_ELEMENT_IN_BRIDGE': {
          iframeAPI.destroy()

          API.updateElementInLocalBridge(args.linkData)
          .then(() => API.getLocalBridgeStatus())
          .then(res => res.data.bridge)
          .then(bridge => {
            buildBridge({
              mode:         C.UPSERT_MODE.EDIT,
              bridgeData:   bridge,
              onSuccess: ({ bridge }) => {
                log('updateElementInBridge onSuccess', bridge)
                showContentElements()
              }
            })
          })
          .catch(e => log.error(e.stack))

          return true
        }

        case 'CLOSE':
          iframeAPI.destroy()
          return true

        case 'WHEEL':
          window.scrollBy(args.deltaX, args.deltaY)
          return true
      }
    }
    const totalWidth  = Math.max(minWidth, width + extraWidth)
    const totalHeight = height + extraHeight

    const iframeAPI   = createIframeWithMask({
      onAsk,
      url:    Ext.extension.getURL('image_area.html'),
      width:  totalWidth,
      height: totalHeight
    })

    setStyle(iframeAPI.$iframe, {
      position:   'absolute',
      top:        pixel(scrollTop(document) + (clientHeight(document) - totalHeight) / 2),
      left:       pixel(scrollLeft(document) + (clientWidth(document) - totalWidth) / 2),
      border:     '1px solid #ccc'
    })
  }

  dataUrlOfImage($img)
  .then(showIframe)
  .catch(e => {
    log.error(e.stack)
  })
}

export const annotate = ({ mode = C.UPSERT_MODE.ADD, linkData = {}, annotationData = {}, onSuccess } = {}) => {
  API.loadRelations()
  .then(relations => {
  const iframeAPI = createIframeWithMask({
    url:    Ext.extension.getURL('annotate.html'),
    width:  600,
    height: 480,
    onAsk: (cmd, args) => {
      log('annotate onAsk', cmd, args)

      switch (cmd) {
        case 'INIT':
          return {
            mode,
            annotationData,
            linkData,
            relations
          }

        case 'DONE':
          onSuccess(args)
          return true

        case 'CLOSE':
          iframeAPI.destroy()
          return true

        case 'ADD_RELATION':
          upsertRelation({
            onSuccess: ({ relation }) => {
              iframeAPI.ask('SELECT_NEW_RELATION', { relation })
            }
          })
          return true
      }
    }
  })

  setStyle(iframeAPI.$iframe, {
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    border: '1px solid #ccc'
  })
  })
}

export const commonMenuOptions = {
  hoverStyle: {
    background: '#f384aa',
    color:      '#fff'
  },
  normalStyle: {
    background: '#fff',
    color:      '#333',
    'font-size':   '13px',
    'line-height': '32px',
    padding:    '0 10px',
    cursor:     'pointer'
  },
  containerStyle: {
    overflow:     'hidden',
    'border-radius': '3px',
    border:       '1px solid #ccc',
    'box-shadow':    'rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px, rgba(0, 0, 0, 0.2) 0px 3px 1px -2px'
  }
}

export const commonMenuItems = () => ({
  annotate: ({ showContentElements }) => ({
    text: i18n.t('annotate'),
    onClick: (e, { linkData }) => {
      log('annotate menu clicked', linkData)
      annotate({ linkData, onSuccess: showContentElements })
    }
  }),
  createBridge: () => ({
    text: i18n.t('createBridge'),
    onClick: (e, { linkData }) => {
      API.resetLocalBridge()
      .then(() => API.createLocalBridge(linkData))
      .then(showMsgAfterCreateBridge)
      .catch(e => log.error(e.stack))
    }
  }),
  buildBridge: ({ showContentElements }) => ({
    text: i18n.t('buildBridge'),
    onClick: (e, { linkData }) => {
      API.buildLocalBridge(linkData)
      .then(() => buildBridge({
        mode:       C.UPSERT_MODE.ADD,
        onSuccess:  showContentElements
      }))
      .catch(e => log.error(e.stack))
    }
  }),
  updateElementInBridge: ({ showContentElements }) => ({
    text: i18n.t('updateElementForBridge'),
    onClick: (e, { linkData }) => {
      API.updateElementInLocalBridge(linkData)
      .then(() => API.getLocalBridgeStatus())
      .then(res => {
        return res.data.bridge
      })
      .then(bridge => {
        buildBridge({
          mode:         C.UPSERT_MODE.EDIT,
          bridgeData:   bridge,
          onSuccess: ({ bridge }) => {
            log('updateElementInBridge onSuccess', bridge)
            showContentElements()
          }
        })
      })
      .catch(e => log.error(e.stack))
    }
  }),
  selectImageArea: ({ getCurrentPage, showContentElements }) => ({
    text: i18n.t('selectImageArea'),
    onClick: (e, { linkData, $img }) => {
      selectImageArea({ linkData, $img, getCurrentPage, showContentElements })
    }
  })
})

export const createGetMenus = ({ showContentElements, getLocalBridge, fixedMenus, decorate = x => x }) => {
  return (menuExtra) => {
    const menus = [...fixedMenus]
    const local = getLocalBridge()
    const localBridgeStatus = local.status
    const localBridgeData   = local.data

    // Note: only show 'Build bridge' if there is already one bridge item, or there is an annotation
    if (localBridgeStatus === LOCAL_BRIDGE_STATUS.ONE || (localBridgeData && localBridgeData.lastAnnotation)) {
      const savedItem     = localBridgeStatus === LOCAL_BRIDGE_STATUS.ONE ? localBridgeData.links[0] : localBridgeData.lastAnnotation.target

      if (!isElementEqual(savedItem, menuExtra.linkData)) {
        menus.push(commonMenuItems().buildBridge({ showContentElements }))
      }
    }

    if (localBridgeStatus === LOCAL_BRIDGE_STATUS.EDITING) {
      const savedItem     = localBridgeData.editBridge.target === EDIT_BRIDGE_TARGET.FROM
                              ? localBridgeData.links[1]
                              : localBridgeData.links[0]

      if (!isElementEqual(savedItem, menuExtra.linkData)) {
        menus.push(commonMenuItems().updateElementInBridge({ showContentElements }))
      }
    }

    return menus.map(decorate)
  }
}

export const isSelectionRangeValid = (currentPage) => (range) => {
  const { elements = [] } = currentPage
  const selectionElements = elements.filter(item => item.type === ELEMENT_TYPE.SELECTION)
  const hasIntersect      = or(...selectionElements.map(item => {
    try {
      return isTwoRangesIntersecting(range, parseRangeJSON(item))
    } catch (e) {
      return false
    }
  }))
  return !hasIntersect
}

export const initContextMenus = ({ getCurrentPage, getLocalBridge, showContentElements }) => {
  const destroy = createContextMenus({
    isSelectionRangeValid: isSelectionRangeValid(getCurrentPage()),
    isImageValid: ($img) => {
      const { width, height } = imageSize($img)
      return width * height > config.settings.minImageArea
    },
    processLinkData: (linkData) => {
      const { elements = [] } = getCurrentPage()
      const found = elements.find(el => isElementEqual(el, linkData))
      return found || linkData
    },
    menusOnSelection: {
      ...commonMenuOptions,
      id: '__on_selection__',
      menus: createGetMenus({
        showContentElements,
        getLocalBridge,
        fixedMenus: [
          commonMenuItems().annotate({ showContentElements }),
          commonMenuItems().createBridge()
        ],
        decorate: (menuItem) => {
          return {
            ...menuItem,
            onClick: (e, extra) => {
              const range     = parseRangeJSON(extra.linkData)
              const rawRect   = range.getBoundingClientRect()
              const rect      = {
                x:      pageX(rawRect.left),
                y:      pageY(rawRect.top),
                width:  rawRect.width,
                height: rawRect.height
              }

              API.captureScreenInSelection({
                rect,
                devicePixelRatio: window.devicePixelRatio
              })
              .then(image => {
                const updatedExtra = setIn(['linkData', 'image'], image, extra)
                menuItem.onClick(e, updatedExtra)
              })
              .catch(e => {
                log.error(e.stack)
              })
            }
          }
        }
      })
    },
    menusOnImage: {
      ...commonMenuOptions,
      id: '__on_image__',
      menus: createGetMenus({
        showContentElements,
        getLocalBridge,
        fixedMenus: [
          commonMenuItems().selectImageArea({ getCurrentPage, showContentElements }),
          commonMenuItems().annotate({ showContentElements }),
          commonMenuItems().createBridge()
        ]
      })
    }
  })

  return () => {
    log('destroying menus')
    destroy.destroy()
  }
}

export const addSubmenuForBadge = ({ link, getLocalBridge, showContentElements }) => {
  const $badge = link.getBadgeContainer()
  const main   = {
    getContainer: () => $badge,
    getRect: () => {
      const raw = $badge.getBoundingClientRect()
      return {
        x:      pageX(raw.left),
        y:      pageY(raw.top),
        width:  raw.width,
        height: raw.height
      }
    }
  }
  const menuPositionFromRect = ({ rect, width, height }) => {
    log('menuPositionFromRect', rect)
    return {
      x: rect.x - width - 10,
      y: rect.y
    }
  }
  const createSub = () => {
    let instance

    return {
      showAround: ({ rect }) => {
        if (instance) return

        instance = showContextMenus({
          menuOptions: {
            ...commonMenuOptions,
            id: uid(),
            menus: createGetMenus({
              showContentElements,
              getLocalBridge,
              fixedMenus: [
                commonMenuItems().annotate({ showContentElements }),
                commonMenuItems().createBridge()
              ]
            })
          },
          eventData: {
            linkData: link.getElement()
          },
          pos: (menuObj) => menuPositionFromRect({
            rect,
            width:    menuObj.width,
            height:   menuObj.height
          })
        })
      },
      getContainer: () => {
        return instance.$container
      },
      destroy: () => {
        instance.destroy()
        instance = null
      }
    }
  }

  const destroySubMenuEffect = submenuEffect({ main, sub: createSub() })
  return destroySubMenuEffect
}

export const bindSocialLoginEvent = (ipc) => {
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'OAUTH_RESULT') {
      const tokenData = e.data.data
      log('got OAUTH_RESULT', tokenData)

      API.saveAccessToken(tokenData.access_token)
      .then(() => {
        notify('successfully logged in')
        // Note: There are cases when oauth result page is redirected by providers (Google, Facebook)
        // In those cases, `window.close()` won't work
        ipc.ask('CLOSE_ME')
      })
    }
  })
}

export const bindSelectionEvent = ({ getCurrentPage }) => {
  const nodeCharacterAt = (node, offset) => node.textContent && node.textContent.charAt(offset)
  const hasPartialWords = (selection) => {
    const isPartialAtStart = isLatinCharacter(nodeCharacterAt(selection.anchorNode, selection.anchorOffset - 1)) &&
                             isLatinCharacter(nodeCharacterAt(selection.anchorNode, selection.anchorOffset))

    const isPartialAtEnd   = isLatinCharacter(nodeCharacterAt(selection.focusNode, selection.focusOffset - 1)) &&
                             isLatinCharacter(nodeCharacterAt(selection.focusNode, selection.focusOffset))

    return isPartialAtStart || isPartialAtEnd
  }

  bindSelectionEnd((e, selection) => {
    if (hasPartialWords(selection)) {
      selection.collapse(null)
      showMessage('Invalid Selection: Selection cannot include a partial word')
      return
    }

    const range = selection.getRangeAt(0)

    if (!isSelectionRangeValid(getCurrentPage())(range)) {
      selection.collapse(null)
      showMessage(i18n.t('invalidSelectionCross'))
    }
  })
}

const fullfilBridgeAndAnnotation = (data) => {
  const findElement = (id) => data.elements.find(item => item.id === id)

  return {
    elements: data.elements,
    bridges:  data.bridges.map(item => ({
      ...item,
      fromElement: findElement(item.from),
      toElement:   findElement(item.to)
    })),
    annotations: data.annotations.map(item => ({
      ...item,
      targetElement: findElement(item.target)
    }))
  }
}

export const genShowContentElements = ({
  getCsAPI,
  getLocalBridge,
  getMouseRevealConfig,
  onUpdateCurrentPage = () => {},
  onUpdateAPI = () => {},
  showSubMenu = true
} = {}) => (() => {
  let linksAPI

  const fn = () => {
    const url = window.location.href
    const showElementsOnMouseReveal = (data, url) => {
      if (linksAPI) linksAPI.destroy()

      onUpdateCurrentPage(data)

      const oldAPI = showLinks({
        ...data,
        url,
        getCsAPI,
        onCreate: showSubMenu
                    ? (api) => addSubmenuForBadge({
                      getLocalBridge,
                      link: api,
                      showContentElements: fn
                    })
                    : () => {}
      })
      oldAPI.hide()

      const mrConfig = getMouseRevealConfig()

      linksAPI = new MouseReveal({
        items:    oldAPI.links,
        distance: mrConfig.nearDistanceInInch * mrConfig.pixelsPerInch,
        duration: mrConfig.nearVisibleDuration,
        onDestroy: () => oldAPI.destroy()
      })

      onUpdateAPI(linksAPI)
    }

    API.annotationsAndBridgesByUrl(url)
    .then(fullfilBridgeAndAnnotation)
    .then(data => {
      log('showContentElements got links', data)
      showElementsOnMouseReveal(data, url)
    })
    .catch(e => log.error(e.stack))

    showHyperLinkBadges()
  }

  return fn
})()
