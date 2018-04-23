import request from 'superagent'
import storage from '../storage'

const apiUrl = 'https://bridgit.io/bridgit/master.php'

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
  const body = JSON.parse(res.text)

  if (body.status === 'error') {
    throw new Error(body.message)
  }

  return body
}

const id    = x => x
const wrap  = (fn, { post = id } = {}) => (...args) => fn(...args).then(onApiReturn).catch(onApiError).then(post)

const storeUserInfo = (data) => {
  return storage.set('userInfo', data)
  .then(() => data)
}

const fetchUserInfo = (data) => {
  return storage.get('userInfo')
}

export const login = wrap(({ email, password }) => {
  return request.post(apiUrl)
  .type('form')
  .send({ email, password, login: true })
}, {
  post: storeUserInfo
})

export const register = wrap(({ name, email, password }) => {
  return request.post(apiUrl)
  .type('form')
  .send({ name, email, password, register: true })
}, {
  post: storeUserInfo
})

export const checkUser = wrap(() => {
  return fetchUserInfo()
  .then(userInfo => {
    if (!userInfo)  throw new Error('not logged in yet')

    return request.post(apiUrl)
    .type('form')
    .send({
      secret: userInfo.user_secret,
      email:  userInfo.user_email,
      login:  true
    })
  })
}, {
  post: storeUserInfo
})

export const logout = () => {
  return storeUserInfo(null)
}
