import Ext from '../web_extension'
import { csInit } from './ipc_bg_cs'
import { popupInit } from './ipc_bg_popup'
import { ipcForIframe } from './cs_postmessage'

const ipc = (function () {
  if (window.top !== window) {
    return ipcForIframe()
  }

  switch (Ext.getPageType()) {
    case 'CONTENT': return csInit()
    case 'POPUP':   return popupInit()
    default:        throw new Error('ipc_dynamic should only been used in content scripts or popup')
  }
})()

export default ipc
