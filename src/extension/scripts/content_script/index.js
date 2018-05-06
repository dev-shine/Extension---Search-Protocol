import ipc from '../../../common/ipc/ipc_cs'
import log from '../../../common/log'
import Ext from '../../../common/web_extension'
import API from '../../../common/api/cs_api'
import { createIframe } from '../../../common/ipc/cs_postmessage'
import { setStyle, scrollLeft, scrollTop, clientWidth, clientHeight, pixel, dataUrlFromImageElement } from '../../../common/dom_utils'
import { captureClientAPI } from '../../../common/capture_screenshot'
import { rect2offset, LINK_PAIR_STATUS, TARGET_TYPE } from '../../../common/models/local_annotation_model'
import {
  createSelectionBox, createButtons, createRect,
  createContextMenus, createIframeWithMask, dataUrlOfImage
} from './common'
import { showLinks } from './show_bridges'

const bindEvents = () => {
  ipc.onAsk(onBgRequest)
}

const init = () => {
  bindEvents()
  initContextMenus()

  API.getUserSettings()
  .then(settings => {
    if (settings.showOnLoad) {
      tryShowBridges()
    }
  })
}

let rectAPI
let linksAPI

const tryShowBridges = () => {
  const url = window.location.href

  API.annotationsAndBridgesByUrl(url)
  .then(data => {
    log('tryShowBridges got links', data)
    showLinks(data, url)
  })
  .catch(e => log.error(e.stack))
}

const onBgRequest = (cmd, args) => {
  switch (cmd) {
    case 'START_ANNOTATION': {
      log('got start annotation', rectAPI)
      if (rectAPI) rectAPI.destroy()
      rectAPI = selectScreenshotArea()
      return true
    }

    case 'SHOW_LINKS': {
      log('got show links', args)
      if (linksAPI) linksAPI.destroy()

      try {
        linksAPI = showLinks(args, window.location.href)
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
  }
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
                onClick: (e, { linkData }) => {
                  log('todo annotate')
                  annotate({ linkData })
                }
              }
            ]
          case LINK_PAIR_STATUS.ONE:
            return [
              {
                text: 'Build Bridge',
                onClick: (e, { linkData }) => {
                  log('todo annotate')
                  annotate({ linkData })
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
                  API.clearLinks()
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
          onClick: (e, { linkData, $img }) => {
            selectImageArea({ linkData, $img })
          }
        }

        switch (linkPairStatus) {
          case LINK_PAIR_STATUS.EMPTY:
            return [
              selectAreaItem,
              {
                text: 'Create Bridge',
                onClick: (e, { linkData }) => {
                  log('todo annotate')
                  annotate({ linkData })
                }
              }
            ]
          case LINK_PAIR_STATUS.ONE:
            return [
              selectAreaItem,
              {
                text: 'Build Bridge',
                onClick: (e, { linkData }) => {
                  log('todo annotate')
                  annotate({ linkData })
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

        case 'DID_SAVE':
          API.getLinkPairStatus()
          .then(linkPair => {
            log('AFTER DID_SAVE', linkPair)
            if (linkPair.status === LINK_PAIR_STATUS.READY) {
              builBridgeWithData(linkPair)
            }
          })
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
  const showIframe  = ({ width, height, dataUrl }) => {
    const onAsk = (cmd, args) => {
      switch (cmd) {
        case 'INIT':
          return {
            linkData,
            dataUrl,
            width,
            height
          }

        case 'ANNOTATE':
          iframeAPI.destroy()
          annotate({ linkData: args.linkData })
          return true

        case 'CLOSE':
          iframeAPI.destroy()
          return true

        case 'WHEEL':
          window.scrollBy(args.deltaX, args.deltaY)
          return true
      }
    }
    const totalWidth  = width + extraWidth
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

const builBridgeWithData = (linkPair) => {
  const p = linkPair ? Promise.resolve(linkPair) : API.getLinkPairStatus()
  return p.then(buildBridge)
}

const buildBridge = (linkPair) => {
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

        case 'DID_SAVE':
          API.getLinkPairStatus()
          .then(({ status }) => {
            if (status === LINK_PAIR_STATUS.READY) {
              buildBridge()
            }
          })
          return undefined
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
