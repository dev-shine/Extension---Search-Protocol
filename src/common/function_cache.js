
// Generate a object key based on a list of parameters
const genKey = (list) => {
  return list.map(item => {
    try {
      return JSON.stringify(item)
    } catch (e) {
      return '' + item
    }
  }).join(',')
}

/**
 * A function to utilize function-level cache, and it supports return type of Promise
 * Provided any function, you can wrap it with `withCache`, then function calls with
 * same parameters will hit the cache
 *
 * @param {function} fn - The function you want to wrap with cache
 * @param {number} timeout - (optional) cache expires after timeout (ms)
 * @param {object} context - (optional) context for fn to run in,
 * @return {function} - wrapped function
 */
export const withCache = (fn, timeout = 1000 * 60 * 10, context) => {
  const cache = {}

  return (...args) => {
    const key = genKey(args)
    const now = new Date() * 1

    if (cache[key] !== undefined && now - cache[key].created < timeout) {
      const obj = cache[key]
      if (obj.isPromise)  return Promise.resolve(obj.val)
      return obj.val
    }

    const ret = fn.apply(context, args)

    // Note: check if it is a promise
    if (ret.then) {
      ret.then(val => {
        cache[key] = {
          val,
          created: new Date() * 1,
          isPromise: true
        }
      })
    } else {
      cache[key] = {
        val: ret,
        created: new Date() * 1,
        isPromise: false
      }
    }

    return ret
  }
}
