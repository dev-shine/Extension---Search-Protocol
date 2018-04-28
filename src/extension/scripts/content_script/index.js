import ipc from '../../../common/ipc/ipc_cs'
import log from '../../../common/log'
import Ext from '../../../common/web_extension'
import API from '../../../common/api/cs_api'
import { createIframe } from '../../../common/ipc/cs_postmessage'
import { Box, getAnchorRects, BOX_ANCHOR_POS } from '../../../common/shapes/box'
import { setStyle, scrollLeft, scrollTop, clientWidth, clientHeight, pixel } from '../../../common/dom_utils'
import { captureClientAPI } from '../../../common/capture_screenshot'
import { rect2offset, LINK_PAIR_STATUS } from '../../../common/models/link_pair_model'

import { createSelectionBox, createButtons, createRect, createContextMenus, createIframeWithMask } from './common'

const bindEvents = () => {
  ipc.onAsk(onBgRequest)
}

const init = () => {
  bindEvents()
  initContextMenus()
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

const linksFromPairs = (pairs, url) => {
  const rectEqual = (r1, r2) => {
    return r1.x === r2.x && r1.y === r2.y &&
            r1.width === r2.width &&
            r1.height === r2.height
  }
  const linkEqual = (l1, l2) => {
    return l1.url === l2.url &&
          // l1.desc === l2.desc &&
          // l1.tags === l2.tags &&
          rectEqual(l1.rect, l2.rect)
  }

  return pairs.reduce((prev, pair) => {
    pair.links.forEach(link => {
      if (link.url !== url) return
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
  const links = linksFromPairs(pairs, url)

  const showOneLink = (link) => {
    const pairCount = Object.keys(link.pairDict).length
    const rectObj   = createRect({
      ...rect2offset(link.rect),
      rectBorderWidth: 3,
      rectStyle: {
        borderStyle: 'dashed',
        pointerEvents: 'none'
      }
    })
    const actionsObj = createButtons([
      {
        text: 'Link Another',
        style: {
          width: 'auto'
        },
        onClick: () => {
          linksAPI.hide()

          API.captureScreenInSelection({
            rect: link.rect,
            devicePixelRatio: window.devicePixelRatio
          })
          .then(image => {
            return API.addLink({
              url:    window.location.href,
              tags:   link.tags,
              desc:   link.desc,
              image:  image,
              rect:   link.rect
            })
          })
          .then(() => {
            linksAPI.destroy()
            setTimeout(() => {
              alert('Successfully captured. Click on extension icon to take further actions')
            }, 500)
            return true
          })
          .catch(e => {
            console.error(e)
          })
        }
      },
      {
        text: pairCount <= 1 ? `${pairCount} Link` : `${pairCount} Links`,
        onClick: () => {
          const iframeAPI = createIframe({
            url:    Ext.extension.getURL('links_modal.html'),
            width:  clientWidth(document),
            height: clientHeight(document),
            onAsk: (cmd, args) => {
              switch (cmd) {
                case 'INIT':
                  return Object.keys(link.pairDict).map(pid => link.pairDict[pid])

                case 'CLOSE':
                  window.removeEventListener('resize', onResize)
                  iframeAPI.destroy()
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
      hide: () => {
        rectObj.hide()
      },
      destroy: () => {
        rectObj.destroy()
        actionsObj.destroy()
      }
    }
  }

  const allLinks = links.map(showOneLink)

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

const initContextMenus = () => {
  let linkPairStatus = LINK_PAIR_STATUS.EMPTY

  const commonOptions = {
    hoverStyle: {
      background: '#f384aa',
      color:      '#fff'
    },
    normalStyle: {
      background: '#fff',
      color:      '#333',
      fontSize:   '13px',
      lineHeight: '32px',
      padding:    '0 10px',
      cursor:     'pointer'
    },
    containerStyle: {
      overflow:     'hidden',
      borderRadius: '3px',
      border:       '1px solid #ccc',
      boxShadow:    'rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px, rgba(0, 0, 0, 0.2) 0px 3px 1px -2px'
    }
  }
  const destroy = createContextMenus({
    menusOnSelection: {
      ...commonOptions,
      id: '__on_selection__',
      menus: () => {
        switch (linkPairStatus) {
          case LINK_PAIR_STATUS.EMPTY:
            return [
              {
                text: 'Create Bridge',
                onClick: () => {
                  log('todo annotate')
                  annotate()
                }
              }
            ]
          case LINK_PAIR_STATUS.ONE:
            return [
              {
                text: 'Build Bridge',
                onClick: () => {
                  log('todo annotate')
                  annotate()
                }
              }
            ]
          case LINK_PAIR_STATUS.TWO:
          case LINK_PAIR_STATUS.READY:
          case LINK_PAIR_STATUS.TOO_MANY:
            return [
              {
                text: 'Clear the temporary bridge data',
                onClick: () => {
                  log('todo clear')
                }
              }
            ]
        }
      }
    },
    menusOnImage: {
      ...commonOptions,
      id: '__on_image__',
      menus: () => {
        const selectAreaItem = {
          text: 'Select Area',
          onClick: () => {
            log('todo select area')
          }
        }

        switch (linkPairStatus) {
          case LINK_PAIR_STATUS.EMPTY:
            return [
              selectAreaItem,
              {
                text: 'Create Bridge',
                onClick: () => {
                  log('todo annotate')
                  annotate()
                }
              }
            ]
          case LINK_PAIR_STATUS.ONE:
            return [
              selectAreaItem,
              {
                text: 'Build Bridge',
                onClick: () => {
                  log('todo annotate')
                  annotate()
                }
              }
            ]
          case LINK_PAIR_STATUS.TWO:
          case LINK_PAIR_STATUS.READY:
          case LINK_PAIR_STATUS.TOO_MANY:
            return [
              {
                text: 'Clear the temporary bridge data',
                onClick: () => {
                  log('todo clear')
                }
              }
            ]
        }
      }
    }
  })

  const pullStatus = () => {
    API.getLinkPairStatus()
    .then(({ status }) => {
      linkPairStatus = status
    })
  }

  const timer = setInterval(pullStatus, 2000)
  return () => clearInterval(timer)
}

const annotate = ({ type, meta } = {}) => {
  const iframeAPI = createIframeWithMask({
    url:    Ext.extension.getURL('annotate.html'),
    width:  600,
    height: 400,
    onAsk: (cmd, args) => {
      switch (cmd) {
        case 'INIT':
          return {
            title: '',
            desc: '',
            tags: ''
          }

        case 'CLOSE':
          iframeAPI.destroy()
          return true
      }
    }
  })

  setStyle(iframeAPI.$iframe, {
    position: 'fixed',
    zIndex: 110000,
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    border: '1px solid #ccc'
  })
}

init()
