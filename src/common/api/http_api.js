import storage from '../storage'
import { pick, unpick, dataURItoBlob, objMap } from '../utils'
import log from '../log'
import config from '../../config'
import jwtRequest from '../jwt_request'
import { decodeElement } from '../api/backend_element_adaptor'
import { decodeBridge } from '../api/backend_bridge_adaptor'
import { decodeNote } from '../api/backend_note_adaptor'
import { withCache } from '../function_cache';

export const apiUrl = (path) => `${config.api.base}${/^\//.test(path) ? path : ('/' + path)}`

const onApiError = (e) => {
  log.error(e.stack)
  let errMessage

  if (!errMessage && e.response && e.response.body && e.response.body.message) {
    const { message } = e.response.body

    if (typeof message === 'string') {
      errMessage = message
    } else if (Array.isArray(message)) {
      errMessage = message[0]
    } else if (Object.keys(message).length > 0) {
      errMessage = message[Object.keys(message)[0]]
    }
  }

  if (!errMessage) {
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

  if (!errMessage && e instanceof Error) {
    errMessage = e.message
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

export const saveAccessToken = (token) => {
  jwtRequest.saveToken(token)
  return true
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
  .field(unpick(['id'], textFields))
})

export const updateElement = (id, data) => {
  throw new Error('todo')
}

export const listElements = wrap((where = {}) => {
  return jwtRequest.get(apiUrl('/elements'))
  .query(where)
})

export const loadElementsByIds = wrap((ids) => {
  return jwtRequest.get(apiUrl('/elements'))
  .query({ 'eids[]': ids })
}, {
  post: elements => elements.map(decodeElement)
})

// Notes
export const getNoteById = wrap((id) => {
  return jwtRequest.get(apiUrl(`/notes/${id}`))
})

export const createNote = wrap((data) => {
  return jwtRequest.post(apiUrl('/notes'))
  .send(data)
})

export const updateNote = wrap((id, data) => {
  return jwtRequest.put(apiUrl(`/notes/${id}`))
  .send(data)
})

export const deleteNote = wrap((id) => {
  return jwtRequest.delete(apiUrl(`/notes/${id}`))
})

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

export const updateBridge = wrap((id, data) => {
  return jwtRequest.put(apiUrl(`/bridges/${id}`))
  .send(data)
})

export const deleteBridge = wrap((id) => {
  return jwtRequest.delete(apiUrl(`/bridges/${id}`))
})

export const listBridges = wrap((where) => {
  return jwtRequest.get(apiUrl('/bridges'))
  .query(where)
})

export const listBridgesWithElementIds = wrap((eids) => {
  return jwtRequest.get(apiUrl('/bridges'))
  .query({ 'eids[]': eids })
}, {
  post: bridges => bridges.map(decodeBridge)
})

// Relations
export const listRelations = wrap(() => {
  return jwtRequest.get(apiUrl('/relations'))
}, {
  post: list => {
    list.sort((a, b) => a.id - b.id)
    return list
  }
})

export const loadRelations = withCache(listRelations, 1000 * 60 * 5)

// others
export const annotationsAndBridgesByUrl = wrap((url) => {
  return jwtRequest.post(apiUrl('/search/page'))
  .send({ url })
}, {
  post: (data) => ({
    elements:     data.elements.map(decodeElement),
    bridges:      data.bridges.map(decodeBridge),
    annotations:  data.notes.map(decodeNote)
  })
})

export const annotationsAndBridgesByUrls = wrap((urls) => {
  return jwtRequest.post(apiUrl('/search/pages'))
  .send({ 'urls': urls })
}, {
  post: (pages) => objMap(data => ({
    elements:     data.elements.map(decodeElement),
    bridges:      data.bridges.map(decodeBridge),
    annotations:  data.notes.map(decodeNote)
  }), pages)
})
