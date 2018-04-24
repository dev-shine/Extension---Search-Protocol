import ipc from '../../common/ipc/ipc_cs'
import log from '../../common/log'
import Ext from '../../common/web_extension'
import API from '../../common/api/cs_api'

const bindEvents = () => {
  ipc.onAsk(onBgRequest)
}

const onBgRequest = (cmd, args) => {
  console.log(cmd, args)

  switch (cmd) {
    case 'START_ANNOTATION': {
      console.log('got start annotation')
      return true
    }
  }
}

console.log('loaded')
bindEvents()
