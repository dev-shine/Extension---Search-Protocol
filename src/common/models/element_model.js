import { BaseModel, createLocalBackend } from './base_model'
import { TARGET_TYPE } from './local_annotation_model'
import { ObjectWith } from '../type_check'

export const backend = createLocalBackend('elements')

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
  text:     String
})

export class ElementModel extends BaseModel {
  shapeOfData (data) {
    switch (data.type) {
      case TARGET_TYPE.IMAGE:       return imageShape
      case TARGET_TYPE.SELECTION:   return selectionShape
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
