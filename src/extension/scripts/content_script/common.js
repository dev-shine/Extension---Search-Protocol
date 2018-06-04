import { reduceRects } from '../../../common/utils'
import {
  setStyle, scrollLeft, scrollTop,
  clientWidth, clientHeight,
  pixel, xpath, imageSize,
  dataUrlFromImageElement
} from '../../../common/dom_utils'
import { Box, getAnchorRects, BOX_ANCHOR_POS } from '../../../common/shapes/box'
import { isPointInRange, selectionToJSON } from '../../../common/selection'
import { createIframe } from '../../../common/ipc/cs_postmessage'
import { ELEMENT_TYPE } from '../../../common/models/element_model'
import API from '../../../common/api/cs_api'
import log from '../../../common/log'

export const commonStyle = {
  boxSizing:  'border-box',
  fontFamily: 'Arial'
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
    zIndex:   100000,
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
    borderRadius: '2px',
    fontSize: '12px',
    color:    '#fff',
    backgroundColor: '#EF5D8F',
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

export const createOverlayForRects = ({ rects, color = '#EF5D8F', opacity = 0.5 }) => {
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
        zIndex:           100000,
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
    zIndex: 100000,
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
        zIndex: curZIndex,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      }
    })

    document.body.appendChild($mask)

    setStyle(iframeAPI.$iframe, {
      zIndex:     curZIndex + 1
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
