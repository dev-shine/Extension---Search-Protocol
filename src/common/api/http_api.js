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

export const signInWithGoogle = ({ name, email }) => {
  return request.post(apiUrl)
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

export const loadLinks = wrap(({ url }) => {
  return request.post(apiUrl)
  .type('form')
  .send({ url, getContent: true })
})

export const postLinks = wrap(ensureLoggedIn(
  ({ link1, link2, relationship, tags, desc }, user) => {
    const rect2offset = (rect) => ({
      top:    rect.y,
      left:   rect.x,
      width:  rect.width,
      height: rect.height
    })

    return request.post(apiUrl)
    .type('form')
    .send({
      addContent:           true,
      user:                 user.user_id,
      c_relation:           relationship,
      c_tags:               tags,
      c_des:                desc,

      link1_url:            link1.url,
      link1_des:            link1.desc,
      link1_tags:           link1.tags,
      link1_image:          '',
      link1_offset:         JSON.stringify(rect2offset(link1.rect)),

      link2_url:            link2.url,
      link2_des:            link2.desc,
      link2_tags:           link2.tags,
      link2_image:          '',
      link2_offset:         JSON.stringify(rect2offset(link2.rect))
    })
  }
))
