import Ext from 'ext'
import storage from '../../common/storage'
import { delay } from '../../common/utils'
import API from '../../common/api/bg_api'
import log from '../../common/log'
import { getTabIpcstore } from '../../common/tab_ipc_store'
import { bgInit as popupBgInit } from '../../common/ipc/ipc_bg_popup'
import { bgInit as csBgInit } from '../../common/ipc/ipc_bg_cs'

const tabIpcStore = getTabIpcstore()

const init = () => {
  initUserSettings()
  bindEvents()
  setupGoogleAnalytics()
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
/* eslint-disable */
const setupGoogleAnalytics = () => {
  (function (i, s, o, g, r, a, m) {i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga'); // Note: https protocol here
    window.ga('create', 'UA-119970780-1', 'auto'); // Enter your GA identifier
    window.ga('set', 'checkProtocolTask', function(){}); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
    window.ga('require', 'displayfeatures');
    window.ga('send', 'pageview', '/bridgit.html'); // Specify the virtual path
  
    window.ga('send','event','Extension Loaded');
}

/* eslint-enable */
init()
