import { bgInit as popupBgInit } from '../ipc/ipc_bg_popup'
import { bgInit as csBgInit } from '../ipc/ipc_bg_cs'
import Ext from '../web_extension'
import { getTabIpcstore } from '../tab_ipc_store'
import { captureScreenInSelection } from '../capture_screenshot'
import { getLinkPair } from '../models/link_pair_model'
import { hackOnce } from '../hack_header'
import * as httpAPI from './http_api'
import * as mockHttpAPI from './mock_http_api'
import log from '../log'

const tabIpcStore = getTabIpcstore()

const init = () => {
  popupBgInit(ipc => ipc.onAsk(onApiRequest))
  csBgInit((tabId, ipc) => ipc.onAsk(onApiRequest))
}

const onApiRequest = (cmd, args) => {
  if (cmd !== 'API_CALL') return
  const { method, params = [] } = args

  log('API_CALL', method, params)

  if (typeof API[method] !== 'function') {
    throw new Error(`API method not found for '${method}'`)
  }

  try {
    return API[method](...params)
  } catch (e) {
    console.error(e.stack)
    throw e
  }
}

init()

const getCurrentTab = () => {
  return Ext.tabs.query({ active: true, lastFocusedWindow: true })
  .then(tabs => {
    const tab = tabs[0]
    if (!tab) throw new Error('no active tab found')
    return tab
  })
}

const getCurrentPageInfo = () => {
  return getCurrentTab()
  .then(tab => ({
    url:    tab.url,
    title:  tab.title
  }))
}

const getCurrentTabIpc = () => {
  return getCurrentTab()
  .then(tab => tabIpcStore.get(tab.id))
}

const API = {
  ...httpAPI,
  ...mockHttpAPI,
  loadLinksForCurrentPage: () => {
    return getCurrentPageInfo()
    .then(info => {
      const isUrlValid = /^(https?|file)/.test(info.url)

      if (!isUrlValid) throw new Error('current page not supported')
      return API.loadLinks({ url: info.url })
    })
  },
  getCurrentPageInfo,
  createTab: (data) => {
    return Ext.tabs.create(data)
  },
  askCurrentTab: (cmd, args) => {
    return getCurrentTabIpc()
    .then(ipc => ipc.ask(cmd, args))
  },
  startAnnotationOnCurrentTab: () => {
    return API.askCurrentTab('START_ANNOTATION', {})
  },
  captureScreenInSelection: ({ rect, devicePixelRatio }) => {
    return getCurrentTabIpc()
    .then(ipc => {
      return captureScreenInSelection({
        rect,
        devicePixelRatio
      }, {
        startCapture: () => {
          return ipc.ask('START_CAPTURE_SCREENSHOT', {})
        },
        endCapture: (pageInfo) => {
          return ipc.ask('END_CAPTURE_SCREENSHOT', { pageInfo })
        },
        scrollPage: (offset, { index, total }) => {
          return ipc.ask('SCROLL_PAGE', { offset })
        }
      })
    })
  },
  getLinkPairStatus: () => {
    const lp = getLinkPair()
    return Promise.resolve({
      status: lp.getStatus(),
      data:   lp.get()
    })
  },
  setLinkPair: (data) => {
    getLinkPair().set(data)
    return Promise.resolve(true)
  },
  addLink: (link) => {
    getLinkPair().addLink(link)
    return Promise.resolve(true)
  },
  clearLinks: () => {
    getLinkPair().clear()
    return Promise.resolve(true)
  },
  saveAnnotation: (data) => {
    // TODO
    log('saveAnnotation', data)
    API.addLink(data)
    return Promise.resolve(true)
  },
  hackHeader: ({ url, headers }) => {
    hackOnce({ url, add: headers })
    return true
  }
}

export default API
