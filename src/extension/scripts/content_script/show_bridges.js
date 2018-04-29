import log from '../../../common/log'
import API from '../../../common/api/cs_api'
import Ext from '../../../common/web_extension'
import { parseRangeJSON } from '../../../common/selection'
import { rect2offset, isLinkEqual, TARGET_TYPE } from '../../../common/models/link_pair_model'
import { createIframe } from '../../../common/ipc/cs_postmessage'
import { liveBuild } from '../../../common/utils'
import {
  setStyle, scrollLeft, scrollTop, clientWidth, clientHeight,
  pixel, pageX, pageY, getElementByXPath
} from '../../../common/dom_utils'
import {
  commonStyle,
  createSelectionBox, createButtons, createRect, createEl,
  createContextMenus, createIframeWithMask,
  createOverlayForRange, createOverlayForRects
} from './common'

export const linksFromPairs = (pairs, url) => {
  return pairs.reduce((prev, pair) => {
    pair.links.forEach(link => {
      if (link.url !== url) return
      const found = prev.find(l => isLinkEqual(l, link))

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

export const showLinks = (pairs, url) => {
  const links     = linksFromPairs(pairs, url)
  log('showLinks pairts => links', links, pairs, url)
  const allLinks  = links.map(link => showOneLink(link, () => linksAPI))

  const linksAPI = {
    links: allLinks,
    hide: () => {
      allLinks.forEach(item => item.hide())
    },
    destroy: () => {
      allLinks.forEach(item => item.destroy())
    }
  }

  return linksAPI
}

export const showOneLink = (link, getLinksAPI) => {
  log('showOneLink', link.type, link)

  switch (link.type) {
    case TARGET_TYPE.SCREENSHOT:
      return showScreenshot(link, getLinksAPI)

    case TARGET_TYPE.IMAGE:
      return showImage(link, getLinksAPI)

    case TARGET_TYPE.SELECTION:
      return showSelection(link, getLinksAPI)

    default:
      throw new Error(`Unsupported type '${link.type}'`)
  }
}

export const showScreenshot = (link, getLinksAPI) => {
  const bridges     = Object.keys(link.pairDict).map(pid => link.pairDict[pid])
  const pairCount   = Object.keys(link.pairDict).length
  const rectObj     = createRect({
    ...rect2offset(link.rect),
    rectBorderWidth: 3,
    rectStyle: {
      borderStyle: 'dashed',
      pointerEvents: 'none'
    },
    containerStyle: {
      zIndex: 'auto'
    }
  })
  const actionsObj = createButtons([
    {
      text: 'Link Another',
      style: {
        width: 'auto'
      },
      onClick: () => {
        getLinksAPI().hide()

        API.captureScreenInSelection({
          rect: link.rect,
          devicePixelRatio: window.devicePixelRatio
        })
        .then(image => {
          return API.addLink({
            ...link,
            image
          })
        })
        .then(() => {
          getLinksAPI().destroy()
          setTimeout(() => {
            alert('Successfully captured. Click on extension icon to take further actions')
          }, 500)
          return true
        })
        .catch(e => {
          log.error(e)
        })
      }
    }
    // {
    //   text: pairCount <= 1 ? `${pairCount} Link` : `${pairCount} Links`,
    //   onClick: () => {
    //     const bridges = Object.keys(link.pairDict).map(pid => link.pairDict[pid])
    //     showBridgesModal(bridges)
    //   }
    // }
  ], {
    groupStyle: {
      position: 'absolute',
      right: '10px',
      top: '10px'
    }
  })

  // log('rectObj', rectObj)
  // log('actionsObj', actionsObj)

  rectObj.$container.appendChild(actionsObj.$group)
  document.body.appendChild(rectObj.$container)

  const topRight    = {
    top:  pixel(link.rect.y),
    left: pixel(link.rect.x + link.rect.width)
  }
  const badgeAPI    = showBridgeCount({
    text:     '' + pairCount,
    position: topRight,
    onClick:  () => showBridgesModal(bridges)
  })

  return {
    rectObj,
    actionsObj,
    show: () => {
      rectObj.show()
      badgeAPI.show()
    },
    hide: () => {
      rectObj.hide()
      badgeAPI.hide()
    },
    destroy: () => {
      rectObj.destroy()
      actionsObj.destroy()
      badgeAPI.destroy()
    }
  }
}

export const showImage = (link, getLinksAPI) => {
  const bridges     = Object.keys(link.pairDict).map(pid => link.pairDict[pid])
  const pairCount   = Object.keys(link.pairDict).length
  const $img        = getElementByXPath(link.locator)
  const boundRect   = $img.getBoundingClientRect()
  const rect        = {
    top:      link.rect.x + boundRect.top,
    left:     link.rect.y + boundRect.left,
    width:    link.rect.width,
    height:   link.rect.height
  }
  const topRight    = {
    top:  pixel(pageY(rect.top)),
    left: pixel(pageX(rect.left + rect.width))
  }

  log('boundRect', boundRect)

  const overlayAPI  = createOverlayForRects({ rects: [rect] })
  const badgeAPI    = showBridgeCount({
    text:     '' + pairCount,
    position: topRight,
    onClick:  () => showBridgesModal(bridges)
  })

  return {
    show: () => {
      overlayAPI.show()
      badgeAPI.show()
    },
    hide: () => {
      overlayAPI.hide()
      badgeAPI.hide()
    },
    destroy: () => {
      overlayAPI.destroy()
      badgeAPI.destroy()
    }
  }
}

export const showSelection = (link, getLinksAPI) => {
  const bridges     = Object.keys(link.pairDict).map(pid => link.pairDict[pid])
  const pairCount   = Object.keys(link.pairDict).length

  const liveBuildAPI = liveBuild({
    bindEvent: (fn) => {
      window.addEventListener('resize', fn)
    },
    unbindEvent: (fn) => {
      window.removeEventListener('resize', fn)
    },
    getFuse: () => {
      const range   = parseRangeJSON(link)
      const rects   = range.getClientRects()
      return Array.from(rects)
    },
    isEqual: (rs1, rs2) => {
      const encode = (rs) => JSON.stringify(rs.map(r => r.toJSON()))
      return encode(rs1) === encode(rs2)
    },
    onFuseChange: (rects, oldAPI) => {
      if (oldAPI) oldAPI.destroy()

      const topRight    = {
        top:  pixel(pageY(rects[0].top)),
        left: pixel(pageX(rects[0].left + rects[0].width))
      }
      const overlayAPI  = createOverlayForRects({ rects })
      const badgeAPI    = showBridgeCount({
        text:     '' + pairCount,
        position: topRight,
        onClick:  () => showBridgesModal(bridges)
      })

      return {
        show: () => {
          overlayAPI.show()
          badgeAPI.show()
        },
        hide: () => {
          overlayAPI.hide()
          badgeAPI.hide()
        },
        destroy: () => {
          overlayAPI.destroy()
          badgeAPI.destroy()
        }
      }
    }
  })

  return {
    show: () => {
      liveBuildAPI.getAPI().show()
    },
    hide: () => {
      liveBuildAPI.getAPI().hide()
    },
    destroy: () => {
      liveBuildAPI.getAPI().destroy()
    }
  }
}

export const showBridgeCount = ({ position, text, onClick }) => {
  const size  = 40
  const $el   = createEl({
    text,
    style: {
      ...commonStyle,
      ...position,
      transform:  'translate(-80%, -80%)',
      position:   'absolute',
      width:      `${size}px`,
      height:     `${size}px`,
      lineHeight: `${size}px`,
      borderRadius: `${size / 2}px`,
      border:     '1px solid #666',
      fontSize:   '18px',
      fontWeight: 'bold',
      background: '#fff',
      color:      '#ef5d8f',
      cursor:     'pointer',
      textAlign:  'center',
      boxShadow:  'rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px, rgba(0, 0, 0, 0.2) 0px 3px 1px -2px'
    }
  })

  $el.addEventListener('click', onClick)
  document.body.appendChild($el)

  return {
    $dom: $el,
    hide: () => {
      setStyle($el, { display: 'none' })
    },
    show: () => {
      setStyle($el, { display: 'block' })
    },
    destroy: () => {
      $el.removeEventListener('click', onClick)
      $el.remove()
    }
  }
}

export const showBridgesModal = (bridges) => {
  const iframeAPI = createIframe({
    url:    Ext.extension.getURL('links_modal.html'),
    width:  clientWidth(document),
    height: clientHeight(document),
    onAsk: (cmd, args) => {
      switch (cmd) {
        case 'INIT':
          return bridges

        case 'CLOSE':
          modalAPI.destroy()
          return true
      }
    }
  })

  const onResize = () => {
    setStyle(iframeAPI.$iframe, {
      width:  pixel(clientWidth(document)),
      height: pixel(clientHeight(document))
    })
  }
  window.addEventListener('resize', onResize)

  setStyle(iframeAPI.$iframe, {
    position: 'fixed',
    zIndex: 110000,
    left: '0',
    top: '0',
    right: '0',
    bottom: '0'
  })

  const modalAPI = {
    destroy: () => {
      window.removeEventListener('resize', onResize)
      iframeAPI.destroy()
    }
  }

  return modalAPI
}
