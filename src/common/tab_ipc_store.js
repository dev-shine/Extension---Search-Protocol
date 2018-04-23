import { until } from './utils'

export class TabIpcStore {
  constructor () {
    this.cache = {}
  }

  get (tabId, timeout = 2000) {
    return until('ipc by tab id', () => {
      const ipc = this.cache[tabId]
      return {
        pass: !!ipc,
        result: ipc
      }
    }, 100, timeout)
  }

  set (tabId, ipc) {
    this.cache[tabId] = ipc
  }

  del (tabId) {
    delete this.cache[tabId]
  }
}

let instance

export function getTabIpcstore () {
  if (instance) return instance
  instance = new TabIpcStore()
  return instance
}
