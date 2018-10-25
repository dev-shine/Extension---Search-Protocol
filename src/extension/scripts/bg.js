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
  setupGoogleAnalytics();
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
  let settings = {}, isLoggedIn = false ;
  storage.addListener(changes => {
    console.log("Changes :: ", changes);
    
    let triggerEvent = false;

    // const settingsChange = changes.find(c => (c.key === 'user_settings' ) )
    // if (!settingsChange)  return
    const settingsChange = changes[0];
    
    if(settingsChange && settingsChange.key) {
      const token = localStorage.getItem("bearer_token")

      if (settingsChange.key === "userInfo") {
        isLoggedIn = (token) ? true : false;
        triggerEvent = true;
      }
      else if(settingsChange.key === "user_settings") {
        settings = settingsChange.newValue;
        const newValue = settingsChange.newValue;
        const oldValue = settingsChange.oldValue;
        const keys = Object.keys(settingsChange.newValue);
        keys.some(key => {          
          if (key !== "dummyField" && newValue[key] !== oldValue[key])  {
            triggerEvent = true;
            return true;
          }
        })
        if (!isLoggedIn && token) {
          isLoggedIn = true;
          triggerEvent = true;
        }
      }

    }
    
    // const settings = settingsChange.newValue

    if (triggerEvent === true) tabIpcStore.forEach(ipc => ipc.ask('UPDATE_SETTINGS', { settings })) //if (triggerEvent == "true")
  })
}

const onPopupRequest = (cmd, args) => {

}

const onCsRequest = (cmd, args) => {
  switch (cmd) {
    case 'CLOSE_ME':
      tabIpcStore.forEach(ipc => ipc.ask('googleLogin'))
      return Ext.tabs.remove(args.sender.tab.id)
  }
}

init()
