import ipc from '../../common/ipc/ipc_cs'
import log from '../../common/log'
import Ext from '../../common/web_extension'
import API from '../../common/api/cs_api'
import { Box, getAnchorRects } from '../../common/shapes/box'
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
  const box = new Box({
    onStateChange: ({ rect }) => {
      rectAPI.updatePos(rect)
    }
  })
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
      left:     pixel(opts.left)
    }
    const rectStyle = {
      ...commonStyle,
      width:    pixel(opts.width),
      height:   pixel(opts.height),
      border:   `${rectBorderWidth}px solid rgb(239, 93, 143)`,
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
    .map(anchor => {
      return {
        anchorPos:  anchor.anchorPos,
        $dom:       createEl({
                      style: {
                        ...anchorStyle,
                        top:      pixel(anchor.rect.y),
                        left:     pixel(anchor.rect.x),
                        width:    pixel(anchorWidth),
                        height:   pixel(anchorWidth)
                      }
                    })
      }
    })

    document.body.appendChild($container)
    $container.appendChild($rectangle)
    $anchors.forEach(item => $container.appendChild(item.$dom))

    return {
      updatePos: (rect) => {

      }
    }
  }
  const rectAPI = createSelection()
}

bindEvents()
