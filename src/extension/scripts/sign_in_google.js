
import { createIframe } from '../../common/ipc/cs_postmessage'
import * as API from '../../common/api/http_api'

const showSuccess = () => {
  document.getElementById('success').style.display = 'block'
  document.getElementById('bridgit_google').style.display = 'none'
}

const signInWithGoogleInIframe = () => {
  const ifr = createIframe({
    url: 'http://www.bridgit.io/bridgit/google_signin.html',
    width: '400px',
    height: '400px',
    onMessage: (e) => {
      const data = e.data

      if (data && data.name && data.email) {
        API.signInWithGoogle({
          name:   data.name,
          email:  data.email
        })
        .then(data => {
          if (!data)  return

          if (data.redirect) {
            window.location.href = data.redirect
            return
          }

          showSuccess()
        })
      }
    }
  })

  ifr.$iframe.style.border = '0'
  ifr.$iframe.id = 'bridgit_google'
}

signInWithGoogleInIframe()
