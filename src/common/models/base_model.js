import { uid } from '../utils'
import storage from '../storage'
import { assertFields }  from '../type_check'

export const MODEL_STATUS = {
  LOCAL:    'LOCAL',
  ID_ONLY:  'ID_ONLY',
  SYNCED:   'SYNCED',
  UNKNOWN:  'UNKNOWN'
}

export class BaseModel {
  constructor ({ id, local, data } = {}) {
    if (id) {
      this.setRemoteId(id)
    } else if (local) {
      this.setLocalData(local)
    } else if (data) {
      this.setSyncedData(data)
    } else {
      this.__status = MODEL_STATUS.UNKNOWN
    }
  }

  fetch (id) {
    throw new Error('should override this method')
  }

  commit (data) {
    throw new Error('should override this method')
  }

  shapeOfData (data) {
    throw new Error('should override this method')
  }

  checkData (data) {
    assertFields(data, this.shapeOfData(data))
  }

  setStatus (status) {
    this.__status = status
  }

  setLocalData (data) {
    this.checkData(data)
    this.__local  = data
    this.__status = MODEL_STATUS.LOCAL
  }

  setSyncedData (data) {
    this.checkData(data)
    this.__data   = data
    this.__status = MODEL_STATUS.SYNCED
  }

  setRemoteId (id) {
    this.__id     = id
    this.__status = MODEL_STATUS.ID_ONLY
  }

  pull () {
    return this.fetch(this.__id)
    .then(data => {
      this.__data   = data
      this.__status = MODEL_STATUS.SYNCED
      return data
    })
  }

  push () {
    return this.commit(this.__local)
    .then(data => {
      this.__data   = data
      this.__status = MODEL_STATUS.SYNCED
      return data
    })
  }

  shouldPull () {
    return this.__status === MODEL_STATUS.ID_ONLY
  }

  shouldPush () {
    return this.__status === MODEL_STATUS.LOCAL
  }

  isSynced () {
    return this.__status === MODEL_STATUS.SYNCED
  }

  sync () {
    if (this.isSynced()) {
      return Promise.resolve(this.__data)
    }

    if (this.shouldPull()) {
      return this.pull()
    }

    if (this.shouldPush()) {
      return this.push()
    }

    throw new Error(`not able to sync in status '${this.__status}'`)
  }
}

export const createLocalBackend = (name) => {
  return {
    commit: (data) => {
      const isAdd = !data.id

      return storage.get(name)
      .then(list => {
        if (isAdd) {
          list.push(data)
        } else {
          const index = list.findIndex(item => item.id === data.id)
          if (index === -1) {
            throw new Error(`item with id '${data.id}' doesn't exist`)
          }
          list[index] = Object.assign(list[index], data)
        }

        return storage.set(name, list).then(() => list)
      })
    },
    fetch: (id) => {
      return storage.get(name)
      .then(list => {
        const found = list.find(item => item.id === id)
        return found
      })
    }
  }
}
