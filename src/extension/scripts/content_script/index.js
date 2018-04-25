import ipc from '../../../common/ipc/ipc_cs'
import log from '../../../common/log'
import Ext from '../../../common/web_extension'
import API from '../../../common/api/cs_api'
import { Box, getAnchorRects, BOX_ANCHOR_POS } from '../../../common/shapes/box'
import { setStyle, scrollLeft, scrollTop, clientWidth, clientHeight, pixel } from '../../../common/dom_utils'
import { captureClientAPI } from '../../../common/capture_screenshot'
import { rect2offset } from '../../../common/models/link_pair_model'

import { createSelectionBox, createButtons, createRect } from './common'

const bindEvents = () => {
  ipc.onAsk(onBgRequest)
}

let rectAPI
let linksAPI

const onBgRequest = (cmd, args) => {
  switch (cmd) {
    case 'START_ANNOTATION': {
      console.log('got start annotation', rectAPI)
      if (rectAPI) rectAPI.destroy()
      rectAPI = createSelectionBox()
      return true
    }

    case 'SHOW_LINKS': {
      console.log('got show links', args.links)
      if (linksAPI) linksAPI.destroy()

      try {
        linksAPI = showLinks(args.links, window.location.href)
      } catch (e) {
        console.error(e.stack)
      }

      return true
    }

    case 'START_CAPTURE_SCREENSHOT': {
      return captureClientAPI.startCapture()
    }

    case 'END_CAPTURE_SCREENSHOT': {
      return captureClientAPI.endCapture(args.pageInfo)
    }

    case 'SCROLL_PAGE': {
      return captureClientAPI.scrollPage(args.offset)
    }
  }
}

const linksFromPairs = (pairs) => {
  const rectEqual = (r1, r2) => {
    return r1.x === r2.x && r1.y === r2.y &&
            r1.width === r2.width &&
            r1.height === r2.height
  }
  const linkEqual = (l1, l2) => {
    return l1.url === l2.url &&
          l1.desc === l2.desc &&
          l1.tags === l2.tags &&
          rectEqual(l1.rect, l2.rect)
  }

  return pairs.reduce((prev, pair) => {
    pair.links.forEach(link => {
      const found = prev.find(l => linkEqual(l, link))

      if (found) {
        found.pairDict[pair.id] = pair
      } else {
        prev.push({
          ...link,
          pairDict: {
            [pair.id]: pair
          }
        })
      }

      return prev
    })
    return prev
  }, [])
}

const showLinks = (pairs, url) => {
  const links = linksFromPairs(pairs)

  const showOneLink = (link) => {
    const pairCount = Object.keys(link.pairDict).length
    const rectObj   = createRect({
      ...rect2offset(link.rect),
      rectBorderWidth: 3,
      rectStyle: {
        borderStyle: 'dashed'
      }
    })
    const actionsObj = createButtons([
      {
        text: 'Link Another',
        style: {
          width: 'auto'
        },
        onClick: () => {
          console.log('TODO link another')
        }
      },
      {
        text: pairCount <= 1 ? `${pairCount} Link` : `${pairCount} Links`,
        onClick: () => {
          console.log('TODO show popup')
        }
      }
    ], {
      groupStyle: {
        position: 'absolute',
        right: '10px',
        top: '10px'
      }
    })

    console.log('rectObj', rectObj)
    console.log('actionsObj', actionsObj)

    rectObj.$container.appendChild(actionsObj.$group)
    document.body.appendChild(rectObj.$container)

    return {
      rectObj,
      actionsObj,
      destroy: () => {
        rectObj.destroy()
        actionsObj.destroy()
      }
    }
  }

  const allLinks = links.map(showOneLink)

  return {
    links: allLinks,
    destroy: () => {
      allLinks.forEach(item => item.destroy())
    }
  }
}

bindEvents()
