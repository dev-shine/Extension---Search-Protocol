import ipc from '../../common/ipc/ipc_cs'
import log from '../../common/log'
import Ext from '../../common/web_extension'
import API from '../../common/api/cs_api'
import { Box, getAnchorRects, BOX_ANCHOR_POS } from '../../common/shapes/box'
import { setStyle, scrollLeft, scrollTop, clientWidth, clientHeight, pixel } from '../../common/dom_utils'

const bindEvents = () => {
  ipc.onAsk(onBgRequest)
}

let rectAPI

const onBgRequest = (cmd, args) => {
  switch (cmd) {
    case 'START_ANNOTATION': {
      console.log('got start annotation', rectAPI)
      if (rectAPI) rectAPI.destroy()
      rectAPI = createAnnotation()
      return true
    }
  }
}

const createEl = ({ tag = 'div', attrs = {}, style = {}, text }) => {
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

const createAnnotation = () => {
  const createSelection = (options = {}) => {
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
    const commonStyle = {
      boxSizing: 'border-box'
    }

    // Note: render selection box
    const containerStyle = {
      ...commonStyle,
      position: 'absolute',
      zIndex:   100000,
      top:      pixel(opts.top),
      left:     pixel(opts.left),
      width:    pixel(opts.width),
      height:   pixel(opts.height)
    }
    const rectStyle = {
      ...commonStyle,
      width:    '100%',
      height:   '100%',
      border:   `${rectBorderWidth}px solid rgb(239, 93, 143)`,
      cursor:   'move',
      background: 'transparent'
    }
    const anchorStyle = {
      ...commonStyle,
      position: 'absolute',
      width:    pixel(anchorWidth),
      height:   pixel(anchorWidth),
      border:   `${anchorBorderWidth}px solid #666`,
      background: '#fff'
    }

    const $container = createEl({ style: containerStyle })
    const $rectangle = createEl({ style: rectStyle })
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

      let isDragging    = false
      let startPos      = { x: 0, y: 0 }

      const onMouseDown = (e) => {
        isDragging = true
        box.moveAnchorStart({ anchorPos })
      }
      const onMouseUp = (e) => {
        if (!isDragging)  return
        isDragging = false
        box.moveAnchorEnd()
      }
      const onMouseMove = (e) => {
        if (!isDragging)  return
        box.moveAnchor({ x: e.pageX, y: e.pageY })
        e.preventDefault()
        e.stopPropagation()
      }

      const $dom = createEl({
        style: {
          ...anchorStyle,
          ...eachStyle,
          cursor,
          width:    pixel(anchorWidth),
          height:   pixel(anchorWidth)
        }
      })

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
      $dom.addEventListener('mousedown', onMouseDown)

      return {
        $dom,
        anchorPos,
        destroy: () => {
          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)
          $dom.removeEventListener('mousedown', onMouseDown)
          $dom.remove()
        }
      }
    })

    let isDragging    = false
    let pos           = { x: 0, y: 0 }
    const onMouseDown = (e) => {
      isDragging = true
      pos = { x: e.pageX, y: e.pageY }
      box.moveBoxStart()
    }
    const onMouseUp   = (e) => {
      if (!isDragging)  return
      isDragging = false
      box.moveBoxEnd()
    }
    const onMouseMove = (e) => {
      if (!isDragging)  return
      box.moveBox({
        dx: e.pageX - pos.x,
        dy: e.pageY - pos.y
      })
      e.preventDefault()
      e.stopPropagation()
    }

    $rectangle.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousemove', onMouseMove)

    const destroyRectangle = () => {
      $rectangle.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mousemove', onMouseMove)
      $rectangle.remove()
    }

    document.body.appendChild($container)
    $container.appendChild($rectangle)
    $anchors.forEach(item => $container.appendChild(item.$dom))

    // Note: render buttons
    const actionsStyle = {
      ...commonStyle,
      position: 'absolute',
      left:     '50%',
      bottom:   '-55px',
      minWidth: '170px',
      height:   '50px',
      transform: 'translateX(-50%)'
    }
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
    const $actions    = createEl({ style: actionsStyle })
    const $selectBtn  = createEl({ tag: 'button', text: 'Select', style: buttonStyle })
    const $closeBtn   = createEl({ tag: 'button', text: 'Close',  style: Object.assign({}, buttonStyle, { backgroundColor: 'red', borderColor: 'red', marginRight: 0 }) })

    $actions.appendChild($selectBtn)
    $actions.appendChild($closeBtn)
    $container.appendChild($actions)

    const onClickSelect = () => {
      console.log('TODO: select')
    }

    const onClickClose = () => {
      rectAPI.destroy()
    }

    $selectBtn.addEventListener('click', onClickSelect)
    $closeBtn.addEventListener('click', onClickClose)

    const destroyActions = () => {
      $selectBtn.removeEventListener('click', onClickSelect)
      $closeBtn.removeEventListener('click', onClickClose)
      $actions.remove()
    }

    // Note: initialize box instance
    const box = new Box({
      x:      opts.left,
      y:      opts.top,
      width:  opts.width,
      height: opts.height,
      onStateChange: ({ rect }) => {
        console.log('onStateChange', rect)
        rectAPI.updatePos(rect)
      }
    })

    return {
      updatePos: (rect) => {
        setStyle($container, {
          top:    pixel(rect.y),
          left:   pixel(rect.x),
          width:  pixel(rect.width),
          height: pixel(rect.height)
        })
      },
      destroy: () => {
        destroyActions()
        destroyRectangle()
        $anchors.forEach(item => item.destroy())
        $container.remove()
      }
    }
  }

  const rectAPI = createSelection()
  return rectAPI
}

bindEvents()
