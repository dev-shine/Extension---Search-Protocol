import * as C from '../../../common/constant'
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
import { LOCAL_BRIDGE_STATUS, EDIT_BRIDGE_TARGET } from '../../../common/models/local_model'
import { ELEMENT_TYPE, isElementEqual } from '../../../common/models/element_model'
import {
  createSelectionBox, createButtons, createRect,
  createContextMenus, createIframeWithMask,
  dataUrlOfImage, notify, submenuEffect, showContextMenus,
  showMessage
} from './common'
import { MouseReveal } from './mouse_reveal'
import { showLinks, showOneLink, showBridgeCount, showHyperLinkBadge } from './show_bridges'
import { parseRangeJSON } from '../../../common/selection'
import { or, setIn, uid, noop, isTwoRangesIntersecting, isLatinCharacter, unique, normalizeUrl, objMap, until, compose, on, map } from '../../../common/utils'
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

let localBridgeStatus = LOCAL_BRIDGE_STATUS.EMPTY
let localBridgeData   = null

const pullStatus = () => {
  API.getLocalBridgeStatus()
  .then(({ status, data }) => {
    localBridgeStatus = status
    localBridgeData   = data

    // log('getLocalBridgeStatus', localBridgeData)
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
  window.addEventListener('message', (e) => {
    if (!e.data)  return

    switch (e.data.type) {
      case 'RELOAD_BRIDGES_AND_NOTES': {
        tryShowBridges()
        return true
      }
    }
  })
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
      showMessage('Invalid Selection: Selection cannot include a partial word')
      return
    }

    const range = selection.getRangeAt(0)

    if (!isSelectionRangeValid(range)) {
      selection.collapse(null)
      showMessage(i18n.t('invalidSelectionCross'))
    }
  })
}

const getCsAPI = () => ({
  annotate,
  buildBridge,
  selectImageArea,
  tryShowBridges
})

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

  const oldAPI = showLinks({
    ...data,
    url,
    getCsAPI,
    onCreate: (api) => addSubmenuForBadge(api)
  })
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

  API.annotationsAndBridgesByUrl(url)
  .then(fullfilBridgeAndAnnotation)
  .then(data => {
    log('tryShowBridges got links', data)
    initLinks(data, url)
  })
  .catch(e => log.error(e.stack))

  showHyperLinkBadges()
}

const showHyperLinkBadges = () => {
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

      until('element', () => {
        let $el = getElementByXPath(element.locator || element.start.locator)

        if ($el && $el.nodeType === 3) {
          $el = $el.parentNode
        }

        return {
          pass: $el,
          result: $el
        }
      }, 500, 10000)
      .then($el => {
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
      })

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
      API.resetLocalBridge()
      .then(() => API.createLocalBridge(linkData))
      .then(showMsgAfterCreateBridge)
      .catch(e => log.error(e.stack))
    }
  },
  buildBridge: {
    text: i18n.t('buildBridge'),
    onClick: (e, { linkData }) => {
      API.buildLocalBridge(linkData)
      .then(() => buildBridge())
      .catch(e => log.error(e.stack))
    }
  },
  updateElementInBridge: {
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
            tryShowBridges()
          }
        })
      })
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

const createGetMenus = (fixedMenus, decorate = x => x) => {
  return (menuExtra) => {
    const menus = [...fixedMenus]

    // Note: only show 'Build bridge' if there is already one bridge item, or there is an annotation
    if (localBridgeStatus === LOCAL_BRIDGE_STATUS.ONE || (localBridgeData && localBridgeData.lastAnnotation)) {
      const savedItem     = localBridgeStatus === LOCAL_BRIDGE_STATUS.ONE ? localBridgeData.links[0] : localBridgeData.lastAnnotation.target

      if (!isElementEqual(savedItem, menuExtra.linkData)) {
        menus.push(commonMenuItems().buildBridge)
      }
    }

    if (localBridgeStatus === LOCAL_BRIDGE_STATUS.EDITING) {
      const savedItem     = localBridgeData.editBridge.target === EDIT_BRIDGE_TARGET.FROM
                              ? localBridgeData.links[1]
                              : localBridgeData.links[0]

      if (!isElementEqual(savedItem, menuExtra.linkData)) {
        menus.push(commonMenuItems().updateElementInBridge)
      }
    }

    return menus.map(decorate)
  }
}

const isSelectionRangeValid = (range) => {
  const { elements = [] } = state.currentPage
  const selectionElements = elements.filter(item => item.type === ELEMENT_TYPE.SELECTION)
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
      menus: createGetMenus([
        commonMenuItems().annotate,
        commonMenuItems().createBridge
      ], (menuItem) => {
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
      })
    },
    menusOnImage: {
      ...commonMenuOptions,
      id: '__on_image__',
      menus: createGetMenus([
        commonMenuItems().selectImageArea,
        commonMenuItems().annotate,
        commonMenuItems().createBridge
      ])
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
            menus: createGetMenus([
              commonMenuItems().annotate,
              commonMenuItems().createBridge
            ])
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

const annotate = ({ mode = C.UPSERT_MODE.ADD, linkData = {}, annotationData = {}, onSuccess = tryShowBridges } = {}) => {
  const iframeAPI = createIframeWithMask({
    url:    Ext.extension.getURL('annotate.html'),
    width:  600,
    height: 400,
    onAsk: (cmd, args) => {
      log('annotate onAsk', cmd, args)

      switch (cmd) {
        case 'INIT':
          return {
            mode,
            annotationData,
            linkData
          }

        case 'DONE':
          onSuccess(args)
          return true

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
}

const selectImageArea = ({ $img, linkData }) => {
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
          } = state.currentPage
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
          annotate({ linkData: args.linkData })
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
          .then(() => buildBridge())
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
                tryShowBridges()
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
            type:   ELEMENT_TYPE.SCREENSHOT,
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

const buildBridge = ({
  bridgeData = {},
  linkPair,
  mode = C.UPSERT_MODE.ADD,
  onSuccess = tryShowBridges } = {}
) => {
  API.loadRelations()
  .then(relations => {
    const iframeAPI = createIframeWithMask({
      url:    Ext.extension.getURL('build_bridge.html'),
      width:  630,
      height: 520,
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
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      border: '1px solid #ccc'
    })
  })
}

const upsertRelation = ({ onSuccess = () => {} }) => {
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

init()
