import React from 'react'
import ReactDOM from 'react-dom'
import {HashRouter} from 'react-router-dom'

import App from './app'
import { Provider, createStore, reducer } from './redux'
import { setUserInfo, setLoaded, setLinkPair } from './actions'
import API from '../common/api/popup_api'

const store = createStore(
  reducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
)

const rootEl = document.getElementById('root');
const render = Component =>
  ReactDOM.render(
    <Provider store={store}>
      <HashRouter>
        <App />
      </HashRouter>
    </Provider>,
    rootEl
  );

// Note: have to delay the render on loading popup.html, there are chances that
// popup window has a wrong size (could be a thin strip).
// refer to https://bugs.chromium.org/p/chromium/issues/detail?id=428044
setTimeout(() => {
  render(App)

  Promise.all([
    API.checkUser().catch(() => null),
    API.getLinkPairStatus().catch(e => console.error('getLinkPairStatus error', e))
  ])
  .then(
    data => {
      const [userInfo, linkPair] = data

      console.log('got linkPair', linkPair)
      store.dispatch(setUserInfo(userInfo))
      store.dispatch(setLinkPair(linkPair))
    },
    e => {
      console.error(e)
      store.dispatch(setUserInfo(null))
    }
  )
  .then(() => {
    store.dispatch(setLoaded(true))
  })
}, 100)
