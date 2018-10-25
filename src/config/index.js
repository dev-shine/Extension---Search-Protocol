/* global __DEVELOPMENT__ */

export default {
  localBackend: false,
  api: {
    // base: __DEVELOPMENT__ ? 'http://bridgit.test/api' : 'https://bridgit.io/app/api',
    // base: 'https://bridgit.io/app/api'
    base: 'http://172.16.1.48:8000/api'
  },
  settings: {
    minImageAreaRatio: 0.05,
    minImageArea: 2500 * 4,
    minImageHeight: 104,
    minImageWidth: 104
  }
}
