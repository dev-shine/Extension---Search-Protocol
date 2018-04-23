import Ext from '../../common/web_extension'
import { delay } from '../../common/utils'

const bindEvents = () => {
  Ext.runtime.onMessage.addListener((req, sender, sendResponse) => {
    console.log('got message', req, sender)

    switch (req.type) {
      default:
        break
    }
  })
}

bindEvents()
