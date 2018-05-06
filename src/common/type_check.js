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
  if (type === String)  return 'String'
  if (type === Number)  return 'Number'
  if (type === Array)   return 'Array'
  if (type === Boolean) return 'Boolean'

  return type.toString()
}

export const typeCheck = (type, field) => {
  if (type === String)  return (a) => typeof a === 'string'
  if (type === Number)  return (a) => typeof a === 'number'
  if (type === Array)   return (a) => Array.isArray(a)
  if (type === Boolean) return (a) => typeof a === 'boolean'

  if (type instanceof ObjectWith) {
    return (a) => {
      const results = Object.keys(type.fieldTypes).map(subField => {
        const subType = type.fieldTypes[subField]
        return typeCheck(subType, subField)(a[subField])
      })

      return and(...results)
    }
  }

  return () => {
    throw new Error(`Unsupported type to check`)
  }
}

export const assertFields = (obj, fieldObj) => {
  Object.keys(fieldObj).forEach(field => {
    if (obj[field] === undefined) {
      throw new Error(`${field} is required`)
    }

    if (!typeCheck(fieldObj[field], field)(obj[field])) {
      throw new Error(`${field} should be a ${typeString(fieldObj[field])}`)
    }
  })
}
