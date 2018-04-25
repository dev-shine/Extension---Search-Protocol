import { type3, types as T } from './action_types'

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

export function setLinkPair (data) {
  return {
    type: T.SET_LINK_PAIR,
    data
  }
}
