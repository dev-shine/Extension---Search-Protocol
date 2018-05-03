import { uid, without } from './utils'
import Ext from './web_extension'

let jobs = {}

export const hackOnce = ({ url, add }) => {
  const lowerAdd = Object.keys(add).reduce((prev, key) => {
    prev[key.toLowerCase()] = add[key]
    return prev
  }, {})
  const listener = (resp) => {
    console.log('got request to hack', resp.url)

    const headers = resp.responseHeaders
    const result  = {}

    for (let i = 0, len = headers.length; i < len; i++) {
      const headerName = headers[i].name.toLowerCase()

      if (lowerAdd[headerName]) {
        headers[i].value    = lowerAdd[headerName]
        result[headerName]  = true
      }
    }

    const rest = without(Object.keys(result), Object.keys(lowerAdd))

    rest.forEach(key => {
      resp.responseHeaders.push({
        name:   key,
        value:  lowerAdd[key]
      })
    })

    setTimeout(() => {
      Ext.webRequest.onHeadersReceived.removeListener(listener)
    }, 100)

    return { responseHeaders: resp.responseHeaders }
  }

  Ext.webRequest.onHeadersReceived.addListener(
    listener,
    { urls: [url] },
    ['blocking', 'responseHeaders']
  )
}
