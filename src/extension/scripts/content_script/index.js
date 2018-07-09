import ipc from '../../../common/ipc/ipc_cs'
import log from '../../../common/log'
import API from 'cs_api'
import {
  getPPI, getElementByXPath
} from '../../../common/dom_utils'
import { captureClientAPI } from '../../../common/capture_screenshot'
import { LOCAL_BRIDGE_STATUS } from '../../../common/models/local_model'
import {
  annotate, buildBridge, selectImageArea, genShowContentElements,
  initContextMenus, bindSelectionEvent, bindSocialLoginEvent
} from './common'
import { showOneLink } from './show_bridges'
import { until, pick } from '../../../common/utils'
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

const getLocalBridge = (() => {
  let localBridgeStatus = LOCAL_BRIDGE_STATUS.EMPTY
  let localBridgeData   = null

  const pullStatus = () => {
    API.getLocalBridgeStatus()
    .then(({ status, data }) => {
      localBridgeStatus = status
      localBridgeData   = data
    })
  }

  setInterval(pullStatus, 2000)

  return () => ({
    data:   localBridgeData,
    status: localBridgeStatus
  })
})()

const setStateWithSettings = (settings) => {
  setState({
    nearDistanceInInch:   settings.nearDistanceInInch,
    nearVisibleDuration:  settings.nearVisibleDuration,
    pixelsPerInch:        getPPI(),
    showOnLoad: settings.showOnLoad
  })
}

const getCurrentPage = () => {
  return state.currentPage
}

const bindEvents = () => {
  ipc.onAsk(onBgRequest)
}

let linksAPI
let destroyMenu
const init = () => {
  const getCsAPI = () => ({
    annotate,
    buildBridge,
    selectImageArea,
    showContentElements
  })
  const showContentElements = genShowContentElements({
    getCsAPI,
    getLocalBridge,
    getMouseRevealConfig: () => pick(['nearDistanceInInch', 'nearVisibleDuration', 'pixelsPerInch'], state),
    onUpdateCurrentPage:  (currentPage) => setState({ currentPage }),
    onUpdateAPI:          (api) => { linksAPI = api }
  })

  bindEvents()
  bindSelectionEvent({ getCurrentPage })
  bindSocialLoginEvent(ipc)

  API.getUserSettings()
  .then(settings => {
    i18n.changeLanguage(settings.language)
    setStateWithSettings(settings)

    if (settings.showOnLoad) {
      destroyMenu = initContextMenus({ getCurrentPage, getLocalBridge, showContentElements })
      showContentElements()
    }
  })
}

const onBgRequest = (cmd, args) => {
  log('onBgRequest', cmd, args)

  switch (cmd) {
    case 'CHANGE_LANGUAGE': {
      i18n.changeLanguage(args)
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
      if (!args.settings.showOnLoad) {
        destroyMenu()
      } else {
        log('enable it')
        init()
      }
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
        $el.scrollIntoView()

        setTimeout(() => {
          const linkAPI = showOneLink({
            link:       element,
            color:      'green',
            opacity: 0.4,
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

// const selectScreenshotArea = () => {
//   return createSelectionBox({
//     onFinish: ({ rectAPI, boxRect }) => {
//       rectAPI.hide()

//       API.captureScreenInSelection({
//         rect: boxRect,
//         devicePixelRatio: window.devicePixelRatio
//       })
//       .then(image => {
//         rectAPI.destroy()
//         annotate({
//           linkData: {
//             type:   ELEMENT_TYPE.SCREENSHOT,
//             url:    window.location.href,
//             image:  image,
//             rect:   boxRect
//           }
//         })
//       })
//       .catch(e => {
//         log.error(e)
//       })
//     }
//   })
// }

init()
