import { BaseModel, createLocalBackend } from './base_model'

const backend = createLocalBackend('bridges')

export class BridgeModel extends BaseModel {
  commit (data) {
    return backend.commit(data)
  }

  fetch (id) {
    return backend.fetch(id)
  }
}
