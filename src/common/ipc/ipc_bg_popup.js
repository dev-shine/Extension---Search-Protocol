import ipcPromise from './ipc_promise'
import Ext from 'ext'

const TIMEOUT = 1000 * 60

// Note: `cuid` is a kind of unique id so that you can create multiple
// ipc promise instances between the same two end points
export const openBgWithPopup = (cuid) => {
  const wrap = (str) => str + '_' + cuid

  const ipcBg = () => {
    let bgListeners = []

    Ext.runtime.onMessage.addListener((req, sender, sendResponse) => {
      bgListeners.forEach(listener => listener(req, sender, sendResponse))
      return true
    })

    return ipcPromise({
      timeout: TIMEOUT,
      ask: function (uid, cmd, args) {
        Ext.runtime.sendMessage({
          type: wrap('BG_ASK_POPUP'),
          uid,
          cmd,
          args
        })
      },
      onAnswer: function (fn) {
        bgListeners.push((req, sender, response) => {
          if (req.type !== wrap('POPUP_ANSWER_BG'))  return
          fn(req.uid, req.err, req.data)
        })
      },
      onAsk: function (fn) {
        bgListeners.push((req, sender, response) => {
          if (req.type !== wrap('POPUP_ASK_BG'))  return
          fn(req.uid, req.cmd, req.args)
        })
      },
      answer: function (uid, err, data) {
        Ext.runtime.sendMessage({
          type: wrap('BG_ANSWER_POPUP'),
          uid,
          err,
          data
        })
      },
      destroy: function () {
        bgListeners = []
      }
    })
  }

  // factory function to generate ipc promise for content scripts
  const ipcPopup = () => {
    let csListeners = []

    Ext.runtime.onMessage.addListener((req, sender, sendResponse) => {
      csListeners.forEach(listener => listener(req, sender, sendResponse))
      return true
    })

    return ipcPromise({
      timeout: TIMEOUT,
      ask: function (uid, cmd, args) {
        // console.log('cs ask', uid, cmd, args)
        Ext.runtime.sendMessage({
          type: wrap('POPUP_ASK_BG'),
          uid,
          cmd,
          args
        })
      },
      onAnswer: function (fn) {
        csListeners.push((req, sender, response) => {
          if (req.type !== wrap('BG_ANSWER_POPUP'))  return
          fn(req.uid, req.err, req.data)
        })
      },
      onAsk: function (fn) {
        csListeners.push((req, sender, response) => {
          if (req.type !== wrap('BG_ASK_POPUP'))  return
          fn(req.uid, req.cmd, req.args)
        })
      },
      answer: function (uid, err, data) {
        Ext.runtime.sendMessage({
          type: wrap('POPUP_ANSWER_BG'),
          uid,
          err,
          data
        })
      },
      destroy: function () {
        csListeners = []
      }
    })
  }

  return {
    ipcPopup,
    ipcBg
  }
}

// Helper function to init ipc promise instance for content scripts
// The idea here is to send CONNECT message to background when initializing
export const popupInit = () => {
  const cuid = '' + Math.floor(Math.random() * 10000)

  console.log('sending Connect...')
  Ext.runtime.sendMessage({
    type: 'CONNECT_POPUP',
    cuid: cuid
  })

  return openBgWithPopup(cuid).ipcPopup()
}

// Helper function to init ipc promise instance for background
// it accepts a `fn` function to handle CONNECT message from content scripts
export const bgInit = (fn) => {
  Ext.runtime.onMessage.addListener((req, sender) => {
    if (req.type === 'CONNECT_POPUP' && req.cuid) {
      fn(openBgWithPopup(req.cuid).ipcBg())
    }
    return true
  })
}
