import { bgInit as popupBgInit } from '../ipc/ipc_bg_popup'
import { bgInit as csBgInit } from '../ipc/ipc_bg_cs'
import Ext from '../web_extension'
import { getTabIpcstore } from '../tab_ipc_store'
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

const getCurrentTabIpc = () => {
  return getCurrentTab()
  .then(tab => tabIpcStore.get(tab.id))
}

const API = {
}

export default API
