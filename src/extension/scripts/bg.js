import Ext from '../../common/web_extension'
import { delay } from '../../common/utils'
import API from '../../common/api/bg_api'
import { getTabIpcstore } from '../../common/tab_ipc_store'
import { bgInit as popupBgInit } from '../../common/ipc/ipc_bg_popup'
import { bgInit as csBgInit } from '../../common/ipc/ipc_bg_cs'

const tabIpcStore = getTabIpcstore()

const bindEvents = () => {
  popupBgInit(ipc => ipc.onAsk(onPopupRequest))
  csBgInit((tabId, ipc) => {
    tabIpcStore.set(tabId, ipc)
    ipc.onAsk(onCsRequest)
  })
}

const onPopupRequest = (cmd, args) => {

}

const onCsRequest = (cmd, args) => {

}

bindEvents()
