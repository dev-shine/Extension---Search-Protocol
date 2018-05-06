import { uid, and, getIn, setIn, updateIn, compose, until } from '../utils'
import { assertFields, ObjectWith }  from '../type_check'
import storage from '../storage'
import log from '../log'

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

  getCurrentData () {
    switch (this.__status) {
      case MODEL_STATUS.LOCAL:      return this.__local
      case MODEL_STATUS.SYNCED:     return this.__data
      default:                      return null
    }
  }

  getDataShape () {
    const currentData = this.getCurrentData()
    return this.shapeOfData(currentData)
  }

  getDependencies () {
    const shape = this.getDataShape()

    const helper = (shape, paths, result) => {
      if ([String, Number, Boolean].indexOf(shape) !== -1) {
        return result
      }

      if (!(shape instanceof ObjectWith)) {
        return [...result, { paths, Klass: shape }]
      }

      const fieldObj = shape.getFieldTypes()
      const extra    =  Object.keys(fieldObj).reduce((prev, key) => {
        const fieldType = fieldObj[key]
        const list      = helper(fieldType, [...paths, key], [])
        return [...prev, ...list]
      }, [])

      return [...result, ...extra]
    }

    return helper(shape, [], [])
  }

  getDependencyInstances () {
    const data      = this.getCurrentData()
    const deps      = this.getDependencies()
    const instances = deps.map(dep => {
      const { paths, Klass } = dep
      const args = getIn(paths, data)
      const ins  = new Klass(args)
      return ins
    })

    return { data, deps, instances }
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
    // Note: replace all id with an object of id
    const deps    = this.getDependencies()
    const changes = deps.map((d, i) => updateIn(d.paths, id => ({ id })))
    const update  = compose(...changes)

    return this.fetch(this.__id)
    .then(data => {
      this.__data   = update(data)
      this.__status = MODEL_STATUS.SYNCED
      return this.__data
    })
  }

  push () {
    const { data, deps, instances } = this.getDependencyInstances()
    const prepare = Promise.all(instances.map(ins => ins.sync()))
    .then(results => {
      // Note: replace all previous dependency data with a string-type id
      const changes = results.map((r, i) => setIn(deps[i].paths, r.id))
      return compose(...changes)(data)
    })

    return prepare
    .then(data => this.commit(data))
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

export const createModelData = (data) => {
  if (typeof data === 'string') {
    return { id: data }
  }

  if (typeof data === 'object') {
    if (data.id) {
      return { data }
    } else {
      return { local: data }
    }
  }

  throw new Error('not able to create data')
}

export const createLocalBackend = (name) => {
  let writeLock = false

  const waitForWriteLock = (fn) => {
    return (...args) => {
      let p

      if (!writeLock) {
        writeLock = true
        p = Promise.resolve()
      } else {
        p = until('write lock', () => ({
          pass:   !writeLock,
          result: true
        }), 100, 1000)
      }

      return p
      .then(() => fn(...args))
      .then(
        data => {
          writeLock = false
          return data
        },
        e => {
          writeLock = true
          throw e
        }
      )
    }
  }

  return {
    commit: waitForWriteLock((data) => {
      const isAdd = !data.id

      return storage.get(name)
      .then((list = []) => {
        let newItem

        if (isAdd) {
          newItem = { id: uid(), ...data }
          list.push(newItem)
        } else {
          const index = list.findIndex(item => item.id === data.id)
          if (index === -1) {
            throw new Error(`item with id '${data.id}' doesn't exist`)
          }
          list[index] = Object.assign(list[index], data)
          newItem     = list[index]
        }

        return storage.set(name, list).then(() => newItem)
      })
    }),
    fetch: (id) => {
      return storage.get(name)
      .then((list = []) => {
        const found = list.find(item => item.id === id)
        return found
      })
    },
    list: (where) => {
      const filter = (item) => {
        return and(
          ...Object.keys(where).map(key => {
            if (Array.isArray(where[key])) {
              return where[key].indexOf(item[key]) !== -1
            } else {
              return item[key] === where[key]
            }
          })
        )
      }

      return storage.get(name)
      .then((list = []) => list.filter(filter))
    }
  }
}
