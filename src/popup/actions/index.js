import { type3, types as T } from './action_types'
import API from '../../common/api/popup_api'
import { LOCAL_BRIDGE_STATUS } from '../../common/models/local_model'

export function setRoute (data) {
  return {
    type: T.SET_ROUTE,
    data
  }
}

export function setUserInfo (data) {
  return {
    type: T.SET_USER_INFO,
    data
  }
}

export function setLoaded (data) {
  document.getElementById('root').classList.toggle('ready', !!data)

  return {
    type: T.SET_LOADED,
    data
  }
}

export function setLocalBridge (data) {
  return {
    type: T.SET_LINK_PAIR,
    data,
    post: ({dispatch, getState}) => {
      // Note: linkPair in state contains two parts `data` and `status`
      // while API.setLocalBridge only accepts `data` part
      const { linkPair } = getState()
      return API.setLocalBridge(linkPair.data)
    }
  }
}

export function resetLocalBridge () {
  return setLocalBridge({
    status: LOCAL_BRIDGE_STATUS.EMPTY,
    data: { links: [], desc: null, tags: null }
  })
}
