import { BaseModel, createLocalBackend } from './base_model'
import { ElementModel } from './element_model'
import { ObjectWith } from '../type_check'
import { unpick } from '../utils'
import config from '../../config'
import * as HttpAPI from '../api/http_api'

export const backend = config.localBackend ? createLocalBackend('bridges') : {
  commit: (data) => {
    const isAdd = !data.id

    if (isAdd) {
      return HttpAPI.createBridge(data)
    } else {
      return HttpAPI.updateBridge(data.id, unpick(['id'], data))
    }
  },
  fetch: (id) => {
    return HttpAPI.getBridgeById(id)
  },
  list: (where = {}) => {
    return HttpAPI.listBridges(where)
  },
  listWithElementId: ({ eid }) => {
    const eids = Array.isArray(eid) ? eid : [eid]
    throw new Error('todo')
  },
  clear: () => {
    throw new Error('todo')
  }
}

const bridgeShape = new ObjectWith({
  // from and to are both id of elements
  from:       ElementModel,
  to:         ElementModel,
  desc:       String,
  tags:       String,
  relation:   String
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
