/* global chrome browser */

(function () {
  var adaptChrome = function (obj, chrome) {
    var adapt = function (src, ret, obj, fn) {
      return Object.keys(obj).reduce(function (prev, key) {
        var keyParts = key.split('.')
        var [
          target,
          source
        ] = keyParts.reduce(function (tuple, subkey) {
          var tar = tuple[0]
          var src = tuple[1]

          tar[subkey] = tar[subkey] || {}
          return [tar[subkey], src[subkey]]
        }, [
          prev,
          src
        ])

        obj[key].forEach(function (method) {
          fn(method, source, target)
        })

        return prev
      }, ret)
    }

    var promisify = function (method, source, target) {
      if (!source)  return

      target[method] = (...args) => {
        return new Promise(function (resolve, reject) {
          var callback = function (result) { resolve(result) }
          source[method].apply(source, args.concat(callback))
        })
      }
    }

    var copy = function (method, source, target) {
      if (!source)  return
      target[method] = source[method]
    }

    return [
      [obj.toPromisify, promisify],
      [obj.toCopy, copy]
    ]
    .reduce(function (prev, tuple) {
      return adapt(chrome, prev, tuple[0], tuple[1])
    }, {})
  }

  var UsedAPI = {
    toPromisify: {
      tabs: ['create'],
      windows: ['getCurrent'],
      runtime: ['sendMessage'],
      notifications: ['create'],
      'storage.local': ['get', 'set']
    },
    toCopy: {
      runtime: ['onMessage'],
      storage: ['onChanged'],
      browserAction: ['setBadgeText', 'setBadgeBackgroundColor']
    }
  }

  var Ext = typeof chrome !== 'undefined' ? adaptChrome(UsedAPI, chrome) : browser

  if (typeof module !== 'undefined') {
    module.exports = Ext
  } else if (typeof window !== 'undefined') {
    window.Ext = Ext
  }
})()
