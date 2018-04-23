import { types as T } from '../actions/action_types'
import { setIn, updateIn } from '../../common/utils'

const initialState = {
  userInfo: null,
  loaded: false,
  route: null
}

export default function reducer (state = initialState, action) {
  switch (action.type) {
    case T.SET_ROUTE:
      return {
        ...state,
        route: action.data
      }

    case T.SET_USER_INFO:
      return {
        ...state,
        userInfo: action.data
      }

    case T.SET_LOADED:
      return {
        ...state,
        loaded: action.data
      }

    default:
      return state
  }
}
