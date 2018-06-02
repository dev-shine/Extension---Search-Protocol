import ipc from '../../../common/ipc/ipc_cs'
import log from '../../../common/log'
import Ext from '../../../common/web_extension'
import API from '../../../common/api/cs_api'
import { createIframe } from '../../../common/ipc/cs_postmessage'
import {
  setStyle, scrollLeft, scrollTop, clientWidth, clientHeight,
  pixel, dataUrlFromImageElement, getPPI, getElementByXPath,
  pageX, pageY, bindSelectionEnd, imageSize
} from '../../../common/dom_utils'
import { captureClientAPI } from '../../../common/capture_screenshot'
import { rect2offset, isLinkEqual, LINK_PAIR_STATUS, TARGET_TYPE } from '../../../common/models/local_annotation_model'
import {
  createSelectionBox, createButtons, createRect,
  createContextMenus, createIframeWithMask,
  dataUrlOfImage, notify, submenuEffect, showContextMenus,
  showMessage
} from './common'
import { MouseReveal } from './mouse_reveal'
import { showLinks, showOneLink, showBridgeCount, showHyperLinkBadge } from './show_bridges'
import { parseRangeJSON } from '../../../common/selection'
import { or, setIn, uid, noop, isTwoRangesIntersecting, isLatinCharacter, unique, normalizeUrl, objMap } from '../../../common/utils'
import { isElementEqual } from '../../../common/models/element_model'
import config from '../../../config'
import i18n from '../../../i18n'

let state = {
  nearDistanceInInch:   1,
  nearVisibleDuration:  2,
  pixelsPerInch: 40,
  currentPage: {
    elements: [],
    bridges: [],
    annotations: []
  }
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

const bindSocialLoginEvent = () => {
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

const bindSelectionEvent = () => {
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
    }

    const range = selection.getRangeAt(0)

    if (!isSelectionRangeValid(range)) {
      selection.collapse(null)
      showMessage('Invalid selection: Selection cannot include partial words')
    }
  })
}

const init = () => {
  bindEvents()
  bindSelectionEvent()
  bindSocialLoginEvent()
  initContextMenus()

  API.getUserSettings()
  .then(settings => {
    i18n.changeLanguage(settings.language)
    setStateWithSettings(settings)

    if (settings.showOnLoad) {
      tryShowBridges()
    }
  })
}

let rectAPI
let linksAPI

const initLinks = (data, url) => {
  if (linksAPI) linksAPI.destroy()

  setState({ currentPage: data })

  const oldAPI = showLinks(data, url, (api) => addSubmenuForBadge(api))
  oldAPI.hide()

  linksAPI = new MouseReveal({
    items:    oldAPI.links,
    distance: state.nearDistanceInInch * state.pixelsPerInch,
    duration: state.nearVisibleDuration,
    onDestroy: () => oldAPI.destroy()
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

  showHyperLinkBadges()
}

const showHyperLinkBadges = () => {
  const $links  = Array.from(document.getElementsByTagName('a'))
  const urlsObj = $links.reduce((prev, $el) => {
    const url = normalizeUrl($el.getAttribute('href'), window.location.href)
    if (!/https?/.test(url))  return prev

    prev[url] = prev[url] || []
    prev[url].push($el)
    return prev
  }, {})
  const urls    = Object.keys(urlsObj)

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

const onBgRequest = (cmd, args) => {
  log('onBgRequest', cmd, args)

  switch (cmd) {
    case 'CHANGE_LANGUAGE': {
      i18n.changeLanguage(args)
      return true
    }

    case 'SHOW_LINKS': {
      log('got show links', args)

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

const commonMenuItems = () => ({
  annotate: {
    text: i18n.t('annotate'),
    onClick: (e, { linkData }) => {
      log('annotate menu clicked', linkData)
      annotate({ linkData })
    }
  },
  createBridge: {
    text: i18n.t('createBridge'),
    onClick: (e, { linkData }) => {
      API.clearLinks()
      .then(() => API.addLink(linkData))
      .then(showMsgAfterCreateBridge)
      .catch(e => log.error(e.stack))
    }
  },
  buildBridge: {
    text: i18n.t('buildBridge'),
    onClick: (e, { linkData }) => {
      API.buildLink(linkData)
      .then(() => buildBridge())
      .catch(e => log.error(e.stack))
    }
  },
  selectImageArea: {
    text: i18n.t('selectImageArea'),
    onClick: (e, { linkData, $img }) => {
      selectImageArea({ linkData, $img })
    }
  }
})

const isSelectionRangeValid = (range) => {
  const { elements = [] } = state.currentPage
  const selectionElements = elements.filter(item => item.type === TARGET_TYPE.SELECTION)
  const hasIntersect      = or(...selectionElements.map(item => isTwoRangesIntersecting(range, parseRangeJSON(item))))
  return !hasIntersect
}

const initContextMenus = () => {
  const destroy = createContextMenus({
    isSelectionRangeValid,
    isImageValid: ($img) => {
      const { width, height } = imageSize($img)
      return width * height > config.settings.minImageArea
    },
    processLinkData: (linkData) => {
      const { elements = [] } = state.currentPage
      const found = elements.find(el => isElementEqual(el, linkData))
      return found || linkData
    },
    menusOnSelection: {
      ...commonMenuOptions,
      id: '__on_selection__',
      menus: (menuExtra) => {
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
          commonMenuItems().annotate,
          commonMenuItems().createBridge
        ]

        // Note: only show 'Build bridge' if there is already one bridge item, or there is an annotation
        if (linkPairStatus === LINK_PAIR_STATUS.ONE || (linkPairData && linkPairData.lastAnnotation)) {
          const savedItem     = linkPairStatus === LINK_PAIR_STATUS.ONE ? linkPairData.links[0] : linkPairData.lastAnnotation.target

          if (!isElementEqual(savedItem, menuExtra.linkData)) {
            menus.push(commonMenuItems().buildBridge)
          }
        }

        return menus.map(decorateOnClick)
      }
    },
    menusOnImage: {
      ...commonMenuOptions,
      id: '__on_image__',
      menus: (menuExtra) => {
        const menus = [
          commonMenuItems().selectImageArea,
          commonMenuItems().annotate,
          commonMenuItems().createBridge
        ]

        // Note: only show 'Build bridge' if there is already one bridge item, or there is an annotation
        if (linkPairStatus === LINK_PAIR_STATUS.ONE || (linkPairData && linkPairData.lastAnnotation)) {
          const savedItem     = linkPairStatus === LINK_PAIR_STATUS.ONE ? linkPairData.links[0] : linkPairData.lastAnnotation.target

          if (!isElementEqual(savedItem, menuExtra.linkData)) {
            menus.push(commonMenuItems().buildBridge)
          }
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
            menus: (menuExtra) => {
              const menus = [
                commonMenuItems().annotate,
                commonMenuItems().createBridge
              ]

              // Note: only show 'Build bridge' if there is already one bridge item, or there is an annotation
              if (linkPairStatus === LINK_PAIR_STATUS.ONE || (linkPairData && linkPairData.lastAnnotation)) {
                const savedItem     = linkPairStatus === LINK_PAIR_STATUS.ONE ? linkPairData.links[0] : linkPairData.lastAnnotation.target

                if (!isElementEqual(savedItem, menuExtra.linkData)) {
                  menus.push(commonMenuItems().buildBridge)
                }
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

const annotate = ({ linkData = {}, onSuccess = tryShowBridges } = {}) => {
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

        case 'DONE':
          tryShowBridges()
          return true

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
        case 'INIT': {
          const { elements = [] }   = state.currentPage
          const imageElements       = elements.filter(item => item.type === TARGET_TYPE.IMAGE)
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
          return API.getLinkPairStatus()
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
          annotate({ linkData: args.linkData })
          return true

        case 'CREATE_BRIDGE': {
          iframeAPI.destroy()

          API.createLink(args.linkData)
          .then(showMsgAfterCreateBridge)
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

const buildBridge = ({ onSuccess = tryShowBridges } = {}) => {
  const iframeAPI = createIframeWithMask({
    url:    Ext.extension.getURL('build_bridge.html'),
    width:  630,
    height: 490,
    onAsk: (cmd, args) => {
      switch (cmd) {
        case 'INIT':
          return {
            title: '',
            desc: '',
            tags: ''
          }

        case 'DONE':
          tryShowBridges()
          return true

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

const showMsgAfterCreateBridge = () => {
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
      zIndex: 110000,
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      border: '1px solid #ccc'
    })
  })
}

init()
