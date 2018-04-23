import ipc from '../ipc/ipc_cs'
import { onMessage } from '../ipc/cs_postmessage'
import { mockAPIWithIPC } from './interface'
import iframeAPI from './cs_iframe_api'

const isIframe = window.top !== window
const init = () => {
  onMessage(window, onApiRequest)
}

// Note: pass on the API CALL request, from iframes inside guest pages, to background page
const onApiRequest = ({ cmd, args }) => {
  if (cmd !== 'API_CALL') return
  return ipc.ask(cmd, args)
}

if (!isIframe) init()

export default isIframe ? iframeAPI : mockAPIWithIPC(ipc)
