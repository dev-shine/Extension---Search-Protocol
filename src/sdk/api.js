import * as API from '../common/api/http_api'

export default {
  ...API,
  checkUser: () => Promise.reject(new Error()),
  showElementInCurrentTab: () => true
}
