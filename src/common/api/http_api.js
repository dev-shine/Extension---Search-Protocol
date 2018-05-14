import storage from '../storage'
import { encodePair, decodePair } from '../models/local_annotation_model'
import { unpick, dataURItoBlob } from '../utils'
import log from '../log'
import config from '../../config'
import jwtRequest from '../jwt_request'

const apiUrl = (path) => `${config.api.base}${/^\//.test(path) ? path : ('/' + path)}`

const onApiError = (e) => {
  let errMessage

  if (e instanceof Error) {
    errMessage = e.message
  } else {
    if (!e.status || e.status === 401 || e.status === 403) {
      errMessage = 'Unauthorised'
    }

    if (e.status === 404) {
      errMessage = 'Not found'
    }

    if (e.status === 500) {
      errMessage = 'Internal server error'
    }
  }

  throw new Error(errMessage)
}

const onApiReturn = (res) => {
  const body = res.body

  if (body.error_code !== 0) {
    throw new Error(body.message)
  }

  return body.data
}

const id    = x => x
const wrap  = (fn, { post = id } = {}) => (...args) => fn(...args).then(onApiReturn).catch(onApiError).then(post)

const storeAccessToken = (res) => {
  log('storeAccessToken', res)
  jwtRequest.saveToken(res.body['access_token'])
  return true
}

const storeUserInfo = (data) => {
  return storage.set('userInfo', data)
  .then(() => data)
}

const fetchUserInfo = () => {
  return storage.get('userInfo')
}

const ensureLoggedIn = (fn) => {
  return (...args) => {
    return fetchUserInfo()
    .then(user => {
      if (!user)  throw new Error('user not logged in yet')
      return fn(...args, user)
    })
  }
}

export const login = ({ email, password }) => {
  return jwtRequest.post(apiUrl('/login'))
  .type('form')
  .send({ email, password })
  .then(storeAccessToken)
  .catch(onApiError)
}

export const register = ({ name, email, password }) => {
  return jwtRequest.post(apiUrl('/register'))
  .type('form')
  .send({ name, email, password })
  .then(storeAccessToken)
  .catch(onApiError)
}

export const signInWithGoogle = ({ name, email }) => {
  return jwtRequest.post(apiUrl('/login/google'))
  .type('form')
  .send({ name, email, googleSignin: true })
  .then(onApiReturn)
  .catch(onApiError)
  .then((data) => {
    return storeUserInfo({
      ...data,
      user_password: ''
    })
  })
}

export const checkUser = () => {
  return fetchUserInfo()
  .then(userInfo => {
    if (userInfo)  return userInfo
    return jwtRequest.get(apiUrl('/user'))
    .then(onApiReturn)
    .then(storeUserInfo)
    .catch(onApiError)
  })
}

export const logout = () => {
  jwtRequest.clearToken()
  storeUserInfo(null)
  return Promise.resolve(true)
}

// Elements
export const getElementById = wrap((id) => {
  return jwtRequest.get(apiUrl(`/elements/${id}`))
})

export const createElement = wrap(({ image, ...textFields }) => {
  if (!image) {
    throw new Error()
  }

  const blob = dataURItoBlob(image)

  return jwtRequest.post(apiUrl('/elements'))
  .attach('image', blob)
  .field(textFields)
})

export const updateElement = (id, data) => {
  throw new Error('todo')
}

export const listElements = wrap((where = {}) => {
  return jwtRequest.get(apiUrl('/elements'))
  .query(where)
})

// Notes
export const getNoteById = wrap((id) => {
  return jwtRequest.get(apiUrl(`/notes/${id}`))
})

export const createNote = wrap((data) => {
  return jwtRequest.post(apiUrl('/notes'))
  .send(data)
})

export const updateNote = (id, data) => {
  throw new Error('todo')
}

export const listNotes = wrap((where) => {
  return jwtRequest.get(apiUrl('/notes'))
  .query(where)
})

// Bridges
export const getBridgeById = wrap((id) => {
  return jwtRequest.get(apiUrl(`/bridges/${id}`))
})

export const createBridge = wrap((data) => {
  return jwtRequest.post(apiUrl('/bridges'))
  .send(data)
})

export const updateBridge = (id, data) => {
  throw new Error('todo')
}

export const listBridges = wrap((where) => {
  return jwtRequest.get(apiUrl('/bridges'))
  .query(where)
})

export const listBridgesWithElementIds = wrap((eids) => {
  return jwtRequest.get(apiUrl('/bridges'))
  .query({ eids })
})
