import { and } from '../utils'

export const LOCAL_BRIDGE_STATUS = {
  EMPTY:    'EMPTY',
  ONE:      'ONE',
  TWO:      'TWO',
  READY:    'READY',
  TOO_MANY: 'TOO_MANY'
}

export const ELEMENT_TYPE = {
  SCREENSHOT: 'SCREENSHOT',
  IMAGE:      'IMAGE',
  SELECTION:  'SELECTION'
}

export class LocalModel {
  state = {

  }
}

export class LinkPairModel {
  constructor () {
    this.__resetPair()
  }

  __resetPair () {
    this.pair = {
      links: [],
      desc: null,
      tags: null,
      relation: null
    }
    this.lastAnnotation = null
  }

  addLink (link) {
    this.pair.links.push(link)
    // Note: any 'create bridge' or 'build bridge' actions should clear the state of last annotation
    // Because at that point, link to last annotation doesn't make that much sense
    this.setLastAnnotation(null)
  }

  clear () {
    this.__resetPair()
  }

  get () {
    return {
      ...this.pair,
      lastAnnotation: this.lastAnnotation
    }
  }

  set (data) {
    this.pair = data
    this.setLastAnnotation(null)
  }

  setLastAnnotation (annotation) {
    this.lastAnnotation = annotation
  }

  getStatus () {
    switch (this.pair.links.length) {
      case 0:   return LOCAL_BRIDGE_STATUS.EMPTY
      case 1:   return LOCAL_BRIDGE_STATUS.ONE
      case 2:   {
        return LOCAL_BRIDGE_STATUS.READY
      }
      default:  return LOCAL_BRIDGE_STATUS.TOO_MANY
    }
  }
}

let instance

export function getLinkPair () {
  if (instance) return instance
  instance = new LinkPairModel()
  return instance
}
