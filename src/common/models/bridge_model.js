import { BaseModel, createLocalBackend } from './base_model'
import { ObjectWith } from '../type_check'

const backend = createLocalBackend('bridges')

const bridgeShape = new ObjectWith({
  // from and to are both id of elements
  from:       String,
  to:         String,
  desc:       String,
  tags:       String,
  // relation is an enum number
  relation:   Number
})

export class BridgeModel extends BaseModel {
  shapeOfData (data) {
    return bridgeShape
  }

  commit (data) {
    return backend.commit(data)
  }

  fetch (id) {
    return backend.fetch(id)
  }
}
