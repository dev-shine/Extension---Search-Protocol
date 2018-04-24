import ipc from '../../common/ipc/ipc_cs'
import log from '../../common/log'
import Ext from '../../common/web_extension'
import API from '../../common/api/cs_api'
import { Box, getAnchorRects, BOX_ANCHOR_POS } from '../../common/shapes/box'
import { setStyle, scrollLeft, scrollTop, clientWidth, clientHeight, pixel } from '../../common/dom_utils'

const bindEvents = () => {
  ipc.onAsk(onBgRequest)
}

const onBgRequest = (cmd, args) => {
  switch (cmd) {
    case 'START_ANNOTATION': {
      console.log('got start annotation')
      createAnnotation()
      return true
    }
  }
}

const createEl = ({ tag = 'div', attrs = {}, style = {} }) => {
  const $el = document.createElement(tag)

  Object.keys(attrs).forEach(key => {
    $el.setAttribute(key, attrs[key])
  })

  setStyle($el, style)
  return $el
}

const createAnnotation = () => {
  const createSelection = (options = {}) => {
    const rectBorderWidth   = 3
    const anchorBorderWidth = 2
    const anchorWidth       = 14
    const width   = options.width || 500
    const height  = options.height || 400
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
        console.log('onMouseDown')
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
        console.log('onMouseMove')
        box.moveAnchor({ x: e.pageX, y: e.pageY })
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

    document.body.appendChild($container)
    $container.appendChild($rectangle)
    $anchors.forEach(item => $container.appendChild(item.$dom))

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

      }
    }
  }
  const rectAPI = createSelection()
}

bindEvents()
