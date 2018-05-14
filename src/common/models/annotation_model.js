import { BaseModel, createLocalBackend } from './base_model'
import { ElementModel } from './element_model'
import { ObjectWith } from '../type_check'
import { unpick } from '../utils'
import config from '../../config'
import * as HttpAPI from '../api/http_api'

export const backend = config.localBackend ? createLocalBackend('annotations') : {
  commit: (data) => {
    const isAdd = !data.id

    if (isAdd) {
      return HttpAPI.createNote(data)
    } else {
      return HttpAPI.updateNote(data.id, unpick(['id'], data))
    }
  },
  fetch: (id) => {
    return HttpAPI.getNoteById(id)
  },
  list: (where = {}) => {
    return HttpAPI.listNotes(where)
  },
  clear: () => {
    throw new Error('todo')
  }
}

const annotationShape = new ObjectWith({
  // target is id of element
  target: ElementModel,
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
