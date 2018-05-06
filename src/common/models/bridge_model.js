import { BaseModel, createLocalBackend } from './base_model'
import { ElementModel } from './element_model'
import { ObjectWith } from '../type_check'

export const backend = {
  ...createLocalBackend('bridges'),
  listWithElementId: ({ eid }) => {
    const check  = Array.isArray(eid)
                      ? (elementId) => eid.indexOf(elementId) !== -1
                      : (elementId) => elementId === eid
    const filter = (item) => check(item.from) || check(item.to)

    return backend.list()
    .then(list => list.filter(filter))
  }
}

const bridgeShape = new ObjectWith({
  // from and to are both id of elements
  from:       ElementModel,
  to:         ElementModel,
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
