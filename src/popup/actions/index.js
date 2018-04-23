import { type3, types as T } from './action_types'

export function setRoute (data) {
  return {
    type: T.SET_ROUTE,
    data
  }
}

export function simpleAction (data) {
  return {
    type: T.WHATEVER,
    data
  }
}
