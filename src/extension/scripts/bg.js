import Ext from 'ext'
import storage from '../../common/storage'
import { delay } from '../../common/utils'
import API from '../../common/api/bg_api'
import log from '../../common/log'
import { getTabIpcstore } from '../../common/tab_ipc_store'
import { bgInit as popupBgInit } from '../../common/ipc/ipc_bg_popup'
import { bgInit as csBgInit } from '../../common/ipc/ipc_bg_cs'
import { setupGoogleAnalytics } from '../../common/google_analytics'

const tabIpcStore = getTabIpcstore()

const init = () => {
  initUserSettings()
  bindEvents()
  setupGoogleAnalytics('Extension', 'Loaded', 'Chrome');
}

const initUserSettings = () => {
  API.getUserSettings()
  .then(data => {
    if (data) return
    return API.resetUserSettings()
  })
  .catch(e => log.error(e.stack))
}

const bindEvents = () => {
  popupBgInit(ipc => ipc.onAsk(onPopupRequest))
  csBgInit((tabId, ipc) => {
    tabIpcStore.set(tabId, ipc)
    ipc.onAsk(onCsRequest)
  })
  storage.addListener(changes => {
    const settingsChange = changes.find(c => c.key === 'user_settings')
    if (!settingsChange)  return

    const settings = settingsChange.newValue
    tabIpcStore.forEach(ipc => ipc.ask('UPDATE_SETTINGS', { settings }))
  })
}

const onPopupRequest = (cmd, args) => {

}

const onCsRequest = (cmd, args) => {
  switch (cmd) {
    case 'CLOSE_ME':
      return Ext.tabs.remove(args.sender.tab.id)
  }
}

init()