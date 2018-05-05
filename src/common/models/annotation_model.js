import { BaseModel, createLocalBackend } from './base_model'

const backend = createLocalBackend('annotations')

export class AnnotationModel extends BaseModel {
  commit (data) {
    return backend.commit(data)
  }

  fetch (id) {
    return backend.fetch(id)
  }
}
