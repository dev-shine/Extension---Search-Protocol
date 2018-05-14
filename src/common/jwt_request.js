import request from 'superagent'

const tokenStorage = (function () {
  const TOKEN_NAME = 'bearer_token'

  // Note: use local storage to store token whenever possible
  return {
    get: () => {
      return localStorage.getItem(TOKEN_NAME)
    },
    set: (token) => {
      return localStorage.setItem(TOKEN_NAME, token)
    },
    remove: () => {
      return localStorage.removeItem(TOKEN_NAME)
    }
  }
})()

const jwtRequest = ['get', 'post', 'put', 'delete'].reduce((prev, method) => {
  prev[method] = (...args) => {
    const token = tokenStorage.get()
    const req   = request[method].apply(request, args)
                    .set('Accept', 'application/json')

    if (token && token.length && token !== 'null') {
      return req.set('Authorization', `Bearer ${token}`)
    }

    return req
  }

  return prev
}, {
  saveToken: (token) => {
    tokenStorage.set(token);
  },
  clearToken: () => {
    tokenStorage.remove();
  },
  getToken: () => {
    return tokenStorage.get()
  },
  header: () => {
    return {
      'Authorization': `Bearer ${tokenStorage.get()}`
    }
  }
})

export default jwtRequest
