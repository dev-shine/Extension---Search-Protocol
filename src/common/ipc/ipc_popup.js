import { popupInit } from './ipc_bg_popup'

const ipc = popupInit()

// Note: one ipc singleton per content script
export default ipc
