import { BaseModel, createLocalBackend } from './base_model'
import { ElementModel } from './element_model'
import { ObjectWith } from '../type_check'
import { unpick } from '../utils'
import config from '../../config'
import * as HttpAPI from '../api/http_api'
import { encodeBridge, decodeBridge } from '../api/backend_bridge_adaptor'

export const backend = config.localBackend ? createLocalBackend('bridges') : {
  commit: (data) => {
    const isAdd = !data.id

    if (isAdd) {
      return HttpAPI.createBridge(encodeBridge(data))
    } else {
      return HttpAPI.updateBridge(data.id, encodeBridge(unpick(['id'], data)))
    }
  },
  fetch: (id) => {
    return HttpAPI.getBridgeById(id).then(decodeBridge)
  },
  list: (where = {}) => {
    return HttpAPI.listBridges(where).then(list => list.map(decodeBridge))
  },
  listWithElementId: ({ eid }) => {
    const eids = Array.isArray(eid) ? eid : [eid]
    return HttpAPI.listBridgesWithElementIds(eids)
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
