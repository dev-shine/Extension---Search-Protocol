import { postMessage } from '../ipc/cs_postmessage'
import { mockAPIWithIPC } from './interface'

const ipc = {
  ask: (cmd, args) => {
    return postMessage(window.top, window, { cmd, args })
  }
}

export default mockAPIWithIPC(ipc)
