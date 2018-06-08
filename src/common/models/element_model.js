import { BaseModel, createLocalBackend } from './base_model'
import { ObjectWith } from '../type_check'
import { unpick, and } from '../utils'
import config from '../../config'
import * as HttpAPI from '../api/http_api'
import { encodeElement, decodeElement } from '../api/backend_element_adaptor'

export const ELEMENT_TYPE = {
  SCREENSHOT: 'SCREENSHOT',
  IMAGE:      'IMAGE',
  SELECTION:  'SELECTION'
}

export const backend = config.localBackend ? createLocalBackend('elements') : {
  commit: (data) => {
    const isAdd = !data.id

    if (isAdd) {
      return HttpAPI.createElement(encodeElement(data))
    } else {
      return HttpAPI.updateElement(data.id, encodeElement(unpick(['id'], data)))
    }
  },
  fetch: (id) => {
    return HttpAPI.getElementById(id).then(decodeElement)
  },
  list: (where = {}) => {
    return HttpAPI.listElements(where).then(list => list.map(decodeElement))
  },
  clear: () => {
    throw new Error('todo')
  }
}

const rectShape  = new ObjectWith({
  x:        Number,
  y:        Number,
  width:    Number,
  height:   Number
})
const selPosShape = new ObjectWith({
  locator:  String,
  offset:   Number
})
const imageShape = new ObjectWith({
  type:     String,
  url:      String,
  locator:  String,
  image:    String,
  rect:     rectShape
})
const selectionShape = new ObjectWith({
  type:     String,
  url:      String,
  start:    selPosShape,
  end:      selPosShape,
  text:     String,
  image:    String
})

export class ElementModel extends BaseModel {
  shapeOfData (data) {
    switch (data.type) {
      case ELEMENT_TYPE.IMAGE:       return imageShape
      case ELEMENT_TYPE.SELECTION:   return selectionShape
      default:
        throw new Error(`Element shapeOfData: unknow type - '${data.type}'`)
    }
  }

  commit (data) {
    return backend.commit(data)
  }

  fetch (id) {
    return backend.fetch(id)
  }
}

export function isElementEqual (a, b) {
  if (a.id && b.id && a.id === b.id)  return true
  if (a.type !== b.type)  return false

  const isEqual       = (x, y) => JSON.stringify(x) === JSON.stringify(y)
  const commonKeys    = ['url']
  const keysToCompare = {
    [ELEMENT_TYPE.IMAGE]:      [...commonKeys, 'imageSize', 'rect', 'locator'],
    [ELEMENT_TYPE.SELECTION]:  [...commonKeys, 'start', 'end', 'text']
  }

  return and(
    ...keysToCompare[a.type].map(key => isEqual(a[key], b[key]))
  )
}
