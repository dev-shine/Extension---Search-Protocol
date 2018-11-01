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
  initContextMenus, bindSelectionEvent, bindSocialLoginEvent, showMessage
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
let showContentElements

bindSocialLoginEvent(ipc)
const init = ({ isLoggedIn = false }) => {
  const getCsAPI = () => ({
    annotate,
    buildBridge,
    selectImageArea,
    showContentElements
  })
  showContentElements = genShowContentElements({
    getCsAPI,
    getLocalBridge,
    getMouseRevealConfig: () => pick(['nearDistanceInInch', 'nearVisibleDuration', 'pixelsPerInch'], state),
    onUpdateCurrentPage:  (currentPage) => setState({ currentPage }),
    onUpdateAPI:          (api) => { linksAPI = api }
  })

  bindEvents()
  isLoggedIn // && bindSelectionEvent({ getCurrentPage })
  API.getUserSettings()
  .then(settings => {
    i18n.changeLanguage(settings.language)
    setStateWithSettings(settings)
      if (showContentElements && typeof showContentElements === 'function') {
        showContentElements({ hide : true })
      }
      if (settings.showOnLoad) {
        destroyMenu = initContextMenus({ getCurrentPage, getLocalBridge, showContentElements, isLoggedIn })
        showContentElements({ isLoggedIn })
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
        destroyMenu && typeof destroyMenu === 'function' && destroyMenu()
        showContentElements({ hide : true })
      } else {
        // destroyMenu && typeof destroyMenu === 'function' && destroyMenu()
        if (destroyMenu && typeof destroyMenu === 'function') {
          console.log('destroying menu')
          destroyMenu()
        }
        showContentElements({ hide : true })
        checkUserBeforeInit({fromListening: 0})
        // init()
      }
      setStateWithSettings(args.settings)

      if (linksAPI) {
        linksAPI.setDistance(state.nearDistanceInInch * state.pixelsPerInch)
        linksAPI.setDuration(state.nearVisibleDuration)
      }

      return true
    }

    case 'googleLogin': {
      checkUserBeforeInit({fromListening: 0});
      return true;
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

/*
fromListening = 0 (Normal flag, when something happen from extension only )
fromListening = 1 (Normal flag, when something happen from web login )
*/
const checkUserBeforeInit = ({fromListening}) => {
  API.checkUser().then(user => {
    init({isLoggedIn:true})
    getLocalStoreFromExtension()
    .then(token => {
      setLocalStore("bridgit-token", token);
      // POSTMessage should pass in only case when event triggered (login from extension) from extension only
      if (fromListening === 0) {
        removeLocalStore("bridgit_logout");
        window.postMessage({type: "BRIDGIT-EXTENSION", token: token},'*');
      }
    })

  })
  .catch(e => {
    init({isLoggedIn:false})
    removeLocalStore("bridgit-token");
    if (fromListening === 0) {
      setLocalStore("bridgit_logout", "1");
      window.postMessage({type: "BRIDGIT-EXTENSION", token: ""},'*');
    }
  })
}

const setLocalStore = (key, value) => {
  localStorage.setItem(key, value);
}

const removeLocalStore = (key) => {
  localStorage.removeItem(key);
}

const getLocalStoreFromExtension = () => {
  return new Promise((resolve, rejecct) => {
    API.getUserToken()
    .then(token => {
      resolve(token);
    })  
})

}

const listen_token_message = () => {

  window.addEventListener("message", event => {

    let data = event.data;
    if (data.type && data.type == "BRIDGIT-WEB" ) {

      if (data.token) {

          API.loginWithToken({token: data.token})
          .then(status => {
            checkUserBeforeInit({fromListening: 1});
          })
          .catch(err => { 
            checkUserBeforeInit({fromListening: 1})
          })
      }
      else {
        API.removeAccessToken();
        API.removeUserInfo();
        setTimeout(() => {
          checkUserBeforeInit({fromListening: 1});
        }, 2000);
      }
  }
    
});

}

const loginMessage = () => {
  API.fetchUserInfo()
  .then(user => {
    if (!user) {
      API.getLoginMessage()
        .then(data => {
          
          if (data && data.message) {
            const showMsg = (e) => {
              showMessage(data.message, {yOffset: (e.clientY < 100) ? 100 : e.clientY });
              window.removeEventListener('mousemove', showMsg);
            }
            window.addEventListener('mousemove', showMsg);
          }

      })
      .catch(err => console.log(err))
    }
  })
}

// document.body.setAttribute('bridgit-installed', true)
localStorage.setItem('bridgit-installed', true)
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOMContentLoaded :: ");

  loginMessage();
  listen_token_message();
  checkUserBeforeInit({fromListening: 1}); // fromListening: 1  is for solving reloading issue in login uniform fnctionality 

  // Run your code here...
});

// init()
