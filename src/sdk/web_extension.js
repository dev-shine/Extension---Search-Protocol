/* global __DEVELOPMENT__ */

export default {
  extension: {
    getURL: (path) => {
      const base    = __DEVELOPMENT__ ? 'http://bridgit.test/sdk/' : 'https://bridgit.io/app/sdk/'
      const urlObj  = new URL(path, base)
      return urlObj.href
    }
  },
  storage: {
    local: {
      get: () => {},
      set: () => {}
    }
  }
}
