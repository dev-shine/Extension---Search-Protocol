
const TYPE = 'CS_MSG'

export const postMsg = (targetWin, myWin, payload, target = '*', timeout = 5000) => {
  return new Promise((resolve, reject) => {
    if (!targetWin || !targetWin.postMessage) {
      throw new Error('csPostMessage: targetWin is not a window', targetWin)
    }

    if (!myWin || !myWin.addEventListener || !myWin.removeEventListener) {
      throw new Error('csPostMessage: myWin is not a window', myWin)
    }

    const secret  = Math.random()
    const type    = TYPE

    // Note: create a listener with a corresponding secret every time
    const onMsg   = (e) => {
      if (e.data && e.data.type === TYPE && !e.data.isRequest && e.data.secret === secret) {
        myWin.removeEventListener('message', onMsg)
        const { payload, error } = e.data

        if (error)                  return reject(new Error(error))
        if (payload !== undefined)  return resolve(payload)

        reject(new Error('csPostMessage: No payload nor error found'))
      }
    }

    myWin.addEventListener('message', onMsg)

    // Note:
    // * `type` to make sure we check our own msg only
    // * `secret` is for 1 to 1 relationship between a msg and a listener
    // * `payload` is the real data you want to send
    // * `isRequest` is to mark that it's not an answer to some previous request
    targetWin.postMessage({
      type,
      secret,
      payload,
      isRequest: true
    }, target)

    setTimeout(() => {
      reject(new Error(`csPostMessage: timeout ${timeout} ms`))
      myWin.removeEventListener('message', onMsg)
    }, timeout)
  })
}

export const onMessage = (win, fn) => {
  if (!win || !win.addEventListener || !win.removeEventListener) {
    throw new Error('csOnMessage: not a window', win)
  }

  const onMsg = (e) => {
    // Note: only respond to msg with `isRequest` as true
    if (e && e.data && e.data.type === TYPE && e.data.isRequest && e.data.secret) {
      const tpl = {
        type: TYPE,
        secret: e.data.secret
      }

      // Note: wrapped with a new Promise to catch any exception during the execution of fn
      new Promise((resolve, reject) => {
        let ret;

        try {
          ret = fn(e.data.payload, {
            source: e.source
          })
        } catch (err) {
          reject(err)
        }

        // Note: only resolve if returned value is not undefined. With this, we can have multiple
        // listeners added to onMessage, and each one takes care of what it really cares
        if (ret !== undefined) {
          resolve(ret)
        }
      })
      .then(
        (res) => {
          if (e.source) {
            e.source.postMessage({
              ...tpl,
              payload: res
            }, '*')
          }
        },
        (err) => {
          if (e.source) {
            e.source.postMessage({
              ...tpl,
              error: err.message
            }, '*')
        }
        }
      )
    }
  }

  win.addEventListener('message', onMsg)
  return () => win.removeEventListener('message', onMsg)
}

export const ipcForIframe = ({ targetWindow = window.top, timeout = 10000 } = {}) => {  
  let onAsk         = () => {}
  const listener    = ({ cmd, args }) => onAsk(cmd, args)
  const removeOnMsg = onMessage(window, listener)

  return {
    ask: (cmd, args) => {
      return postMsg(targetWindow, window, { cmd, args }, '*', timeout)
    },
    onAsk: (fn) => {
      onAsk = fn
    },
    destroy: () => {
      removeOnMsg()
    }
  }
}

export const createIframe = ({ url, width, height, onLoad, onAsk, onMsg, ipcTimeout = 10000 }) => {
  const $iframe = document.createElement('iframe')
  const pLoad   = new Promise((resolve, reject) => {
    if (width)  $iframe.width   = width
    if (height) $iframe.height  = height

    $iframe.addEventListener('load', () => {
      if (typeof onLoad === 'function') {
        try { onLoad() } catch (e) {}
      }
      resolve()
    })
    $iframe.src = url
    $iframe.style.width   = width + 'px'
    $iframe.style.height  = height + 'px'
    document.body.appendChild($iframe)
  })
  const removeOnMsg = onMessage(window, ({ cmd, args }) => {
    if (onAsk) {
      return onAsk(cmd, args)
    }
  })
  const removeListener = (function () {
    if (!onMsg) return () => {}
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  })()

  return {
    $iframe,
    destroy: () => {
      if ($iframe)  $iframe.remove()
      removeOnMsg()
      removeListener()
    },
    ask: (cmd, args) => {
      return pLoad.then(() => {
        return postMsg($iframe.contentWindow, window, { cmd, args }, '*', ipcTimeout)
      })
    }
  }
}

export const passWheelEvent = (ipc) => {
  const onWheel = (e) => {
    ipc.ask('WHEEL', { deltaX: e.deltaX, deltaY: e.deltaY, deltaZ: e.deltaZ })
  }

  document.addEventListener('wheel', onWheel)
  return () => document.removeEventListener(onWheel)
}
