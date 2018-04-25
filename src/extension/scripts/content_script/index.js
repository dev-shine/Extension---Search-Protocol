import ipc from '../../../common/ipc/ipc_cs'
import log from '../../../common/log'
import Ext from '../../../common/web_extension'
import API from '../../../common/api/cs_api'
import { Box, getAnchorRects, BOX_ANCHOR_POS } from '../../../common/shapes/box'
import { setStyle, scrollLeft, scrollTop, clientWidth, clientHeight, pixel } from '../../../common/dom_utils'
import { captureClientAPI } from '../../../common/capture_screenshot'

import { createSelectionBox } from './common'

const bindEvents = () => {
  ipc.onAsk(onBgRequest)
}

let rectAPI

const onBgRequest = (cmd, args) => {
  switch (cmd) {
    case 'START_ANNOTATION': {
      console.log('got start annotation', rectAPI)
      if (rectAPI) rectAPI.destroy()
      rectAPI = createSelectionBox()
      return true
    }

    case 'SHOW_LINKS': {
      console.log('got show links', args.links)
      return true
    }

    case 'START_CAPTURE_SCREENSHOT': {
      return captureClientAPI.startCapture()
    }

    case 'END_CAPTURE_SCREENSHOT': {
      return captureClientAPI.endCapture(args.pageInfo)
    }

    case 'SCROLL_PAGE': {
      return captureClientAPI.scrollPage(args.offset)
    }
  }
}

bindEvents()
