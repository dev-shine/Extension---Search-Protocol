import { BaseModel, createLocalBackend } from './base_model'
import { ObjectWith } from '../type_check'

export const backend = createLocalBackend('annotations')

const annotationShape = new ObjectWith({
  // target is id of element
  target: String,
  title:  String,
  desc:   String,
  tags:   String
})

export class AnnotationModel extends BaseModel {
  shapeOfData (data) {
    return annotationShape
  }

  commit (data) {
    return backend.commit(data)
  }

  fetch (id) {
    return backend.fetch(id)
  }
}
