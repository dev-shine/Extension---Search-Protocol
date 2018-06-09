import { postMsg } from '../ipc/cs_postmessage'
import { mockAPIWithIPC } from './interface'

const ipc = {
  ask: (cmd, args) => {
    return postMsg(window.top, window, { cmd, args })
  }
}

export default mockAPIWithIPC(ipc)
