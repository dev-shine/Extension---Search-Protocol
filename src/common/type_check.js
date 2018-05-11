export class ObjectWith {
  constructor (fieldTypes) {
    this.fieldTypes = fieldTypes
  }

  getFieldTypes () {
    return this.fieldTypes
  }

  toString () {
    const data = objMap((val, key) => {
      return typeString(val)
    }, this.fieldTypes)

    return JSON.stringify(data).replace(/"(String|Number|Array)"/g, ' $1')
  }
}

export const objMap = (fn, obj) => {
  return Object.keys(obj).reduce((prev, key, i) => {
    prev[key] = fn(obj[key], key, i)
    return prev
  }, {})
}

export const and = (...list) => list.reduce((prev, cur) => prev && cur, true)

export const typeString = (type) => {
  if (type === String)    return 'String'
  if (type === Number)    return 'Number'
  if (type === Array)     return 'Array'
  if (type === Boolean)   return 'Boolean'
  if (type === Function)  return 'Function'

  return type.toString()
}

export const typeCheck = (type) => {
  if (type === String)    return (a) => typeof a === 'string'
  if (type === Number)    return (a) => typeof a === 'number'
  if (type === Array)     return (a) => Array.isArray(a)
  if (type === Boolean)   return (a) => typeof a === 'boolean'
  if (type === Function)  return (a) => typeof a === 'function'

  if (type instanceof ObjectWith) {
    return (a) => {
      const results = Object.keys(type.fieldTypes).map(subField => {
        const subType = type.fieldTypes[subField]
        return typeCheck(subType, subField)(a[subField])
      })

      return and(...results)
    }
  }

  // Note: XxxModel could be in form of { id }, { local } or { data }
  return (a) => {
    return a && (!!a.id || !!a.local || !!a.data)
  }
}

export const assertFields = (obj, fieldObj) => {
  const fieldTypes = (fieldObj instanceof ObjectWith) ? fieldObj.getFieldTypes() : fieldObj

  Object.keys(fieldTypes).forEach(field => {
    if (obj[field] === undefined) {
      throw new Error(`${field} is required`)
    }

    if (!typeCheck(fieldTypes[field], field)(obj[field])) {
      throw new Error(`${field} should be a ${typeString(fieldTypes[field])}`)
    }
  })
}
