import { BaseModel, createLocalBackend } from './base_model'

const backend = createLocalBackend('elements')

export class ElementModel extends BaseModel {
  commit (data) {
    return backend.commit(data)
  }

  fetch (id) {
    return backend.fetch(id)
  }
}
