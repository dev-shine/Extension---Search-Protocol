import ipc from '../../../common/ipc/ipc_cs'
import log from '../../../common/log'
import Ext from '../../../common/web_extension'
import API from '../../../common/api/cs_api'
import { createIframe } from '../../../common/ipc/cs_postmessage'
import {
  setStyle, scrollLeft, scrollTop, clientWidth, clientHeight,
  pixel, dataUrlFromImageElement, getPPI, getElementByXPath,
  pageX, pageY
} from '../../../common/dom_utils'
import { captureClientAPI } from '../../../common/capture_screenshot'
import { rect2offset, LINK_PAIR_STATUS, TARGET_TYPE } from '../../../common/models/local_annotation_model'
import {
  createSelectionBox, createButtons, createRect,
  createContextMenus, createIframeWithMask,
  dataUrlOfImage, notify, submenuEffect, showContextMenus
} from './common'
import { MouseReveal } from './mouse_reveal'
import { showLinks, showOneLink } from './show_bridges'
import { parseRangeJSON } from '../../../common/selection'
import { setIn, uid } from '../../../common/utils'

let state = {
  nearDistanceInInch:   1,
  nearVisibleDuration:  2,
  pixelsPerInch: 40
}

const setState = (obj) => {
  state = {
    ...state,
    ...obj
  }
}

let linkPairStatus = LINK_PAIR_STATUS.EMPTY
let linkPairData   = null

const pullStatus = () => {
  API.getLinkPairStatus()
  .then(({ status, data }) => {
    linkPairStatus = status
    linkPairData   = data

    // log('getLinkPairStatus', linkPairData)
  })
}

const timer = setInterval(pullStatus, 2000)

const setStateWithSettings = (settings) => {
  setState({
    nearDistanceInInch:   settings.nearDistanceInInch,
    nearVisibleDuration:  settings.nearVisibleDuration,
    pixelsPerInch:        getPPI()
  })
}

const bindEvents = () => {
  ipc.onAsk(onBgRequest)
}

const init = () => {
  bindEvents()
  initContextMenus()

  API.getUserSettings()
  .then(settings => {
    setStateWithSettings(settings)

    if (settings.showOnLoad) {
      tryShowBridges()
    }
  })
}

let rectAPI
let linksAPI

const initLinks = (data, url) => {
  const oldAPI = showLinks(data, url, (api) => addSubmenuForBadge(api))
  oldAPI.hide()

  log('distance', state.nearDistanceInInch, state.pixelsPerInch)

  linksAPI = new MouseReveal({
    items:    oldAPI.links,
    distance: state.nearDistanceInInch * state.pixelsPerInch,
    duration: state.nearVisibleDuration
  })
}

const tryShowBridges = () => {
  const url = window.location.href

  API.annotationsAndBridgesByUrl(url)
  .then(data => {
    log('tryShowBridges got links', data)
    initLinks(data, url)
  })
  .catch(e => log.error(e.stack))
}

const onBgRequest = (cmd, args) => {
  log('onBgRequest', cmd, args)

  switch (cmd) {
    case 'SHOW_LINKS': {
      log('got show links', args)
      if (linksAPI) linksAPI.destroy()

      try {
        initLinks(args, window.location.href)
      } catch (e) {
        log.error(e.stack)
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

    case 'UPDATE_SETTINGS': {
      log('Got UPDATE_SETTINGS', args)
      setStateWithSettings(args.settings)

      if (linksAPI) {
        linksAPI.setDistance(state.nearDistanceInInch * state.pixelsPerInch)
        linksAPI.setDuration(state.nearVisibleDuration)
      }

      return true
    }

    case 'HIGHLIGHT_ELEMENT': {
      const { element } = args
      let $el = getElementByXPath(element.locator || element.start.locator)

      if ($el.nodeType === 3) {
        $el = $el.parentNode
      }

      $el.scrollIntoView({ block: 'center' })

      setTimeout(() => {
        const linkAPI = showOneLink({
          link:       element,
          color:      'green',
          needBadge:  false
        })

        setTimeout(() => {
          linkAPI.destroy()
        }, 2000)
      }, 1000)

      return true
    }
  }
}

const commonMenuOptions = {
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

const commonMenuItems = {
  annotate: {
    text: 'Annotate',
    onClick: (e, { linkData }) => {
      log('annotate menu clicked', linkData)
      annotate({ linkData })
    }
  },
  createBridge: {
    text: 'Create Bridge',
    onClick: (e, { linkData }) => {
      API.clearLinks()
      .then(() => API.addLink(linkData))
      .then(() => notify('Content selected. Please select another content and right click on it to build bridge'))
      .catch(e => log.error(e.stack))
    }
  },
  buildBridge: {
    text: 'Build Bridge',
    onClick: (e, { linkData }) => {
      API.buildLink(linkData)
      .then(() => buildBridge())
      .catch(e => log.error(e.stack))
    }
  },
  selectImageArea: {
    text: 'Select Area',
    onClick: (e, { linkData, $img }) => {
      selectImageArea({ linkData, $img })
    }
  }
}

const initContextMenus = () => {
  const destroy = createContextMenus({
    menusOnSelection: {
      ...commonMenuOptions,
      id: '__on_selection__',
      menus: () => {
        const decorateOnClick = (menuItem) => {
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

        const menus = [
          commonMenuItems.annotate,
          commonMenuItems.createBridge
        ]

        // Note: only show 'Build bridge' if there is already one bridge item, or there is an annotation
        if (linkPairStatus === LINK_PAIR_STATUS.ONE || (linkPairData && linkPairData.lastAnnotation)) {
          menus.push(commonMenuItems.buildBridge)
        }

        return menus.map(decorateOnClick)
      }
    },
    menusOnImage: {
      ...commonMenuOptions,
      id: '__on_image__',
      menus: () => {
        const menus = [
          commonMenuItems.selectImageArea,
          commonMenuItems.annotate,
          commonMenuItems.createBridge
        ]

        // Note: only show 'Build bridge' if there is already one bridge item, or there is an annotation
        if (linkPairStatus === LINK_PAIR_STATUS.ONE || (linkPairData && linkPairData.lastAnnotation)) {
          menus.push(commonMenuItems.buildBridge)
        }

        return menus
      }
    }
  })

  return () => {}
}

const addSubmenuForBadge = (link) => {
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
  const menuPositionFromRect = (rect) => {
    log('menuPositionFromRect', rect)
    return {
      x: rect.x - 110,
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
            menus: () => {
              const menus = [
                commonMenuItems.annotate,
                commonMenuItems.createBridge
              ]

              // Note: only show 'Build bridge' if there is already one bridge item, or there is an annotation
              if (linkPairStatus === LINK_PAIR_STATUS.ONE || (linkPairData && linkPairData.lastAnnotation)) {
                menus.push(commonMenuItems.buildBridge)
              }

              return menus
            }
          },
          eventData: {
            linkData: link.getElement()
          },
          pos: menuPositionFromRect(rect)
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

const annotate = ({ linkData = {} } = {}) => {
  const iframeAPI = createIframeWithMask({
    url:    Ext.extension.getURL('annotate.html'),
    width:  600,
    height: 400,
    onAsk: (cmd, args) => {
      log('annotate onAsk', cmd, args)

      switch (cmd) {
        case 'INIT':
          return {
            title: '',
            desc: '',
            tags: '',
            ...linkData
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

const selectImageArea = ({ $img, linkData }) => {
  const extraWidth  = 40
  const extraHeight = 100
  const minWidth    = 500
  const showIframe  = ({ width, height, dataUrl }) => {
    const onAsk = (cmd, args) => {
      switch (cmd) {
        case 'INIT':
          return API.getLinkPairStatus()
          .then(linkPair => {
            return {
              linkPair,
              linkData,
              dataUrl,
              width,
              height
            }
          })

        case 'ANNOTATE':
          iframeAPI.destroy()
          annotate({ linkData: args.linkData })
          return true

        case 'CREATE_BRIDGE': {
          iframeAPI.destroy()

          API.createLink(args.linkData)
          .then(() => notify('Content selected. Please select another content and right click on it to build bridge'))
          .catch(e => log.error(e.stack))

          return true
        }

        case 'BUILD_BRIDGE': {
          iframeAPI.destroy()

          API.buildLink(args.linkData)
          .then(() => buildBridge())
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
      zIndex:     110000,
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

const selectScreenshotArea = () => {
  return createSelectionBox({
    onFinish: ({ rectAPI, boxRect }) => {
      rectAPI.hide()

      API.captureScreenInSelection({
        rect: boxRect,
        devicePixelRatio: window.devicePixelRatio
      })
      .then(image => {
        rectAPI.destroy()
        annotate({
          linkData: {
            type:   TARGET_TYPE.SCREENSHOT,
            url:    window.location.href,
            image:  image,
            rect:   boxRect
          }
        })
      })
      .catch(e => {
        log.error(e)
      })
    }
  })
}

const buildBridge = () => {
  const iframeAPI = createIframeWithMask({
    url:    Ext.extension.getURL('build_bridge.html'),
    width:  600,
    height: 480,
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
