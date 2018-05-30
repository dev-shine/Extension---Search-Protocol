import React from 'react'
import ReactDOM from 'react-dom'
import App from './app'
import ipc from '../common/ipc/ipc_dynamic'
import { passWheelEvent } from '../common/ipc/cs_postmessage'
import '../i18n'

if (window.top !== window) {
  passWheelEvent(ipc)
}

const rootEl = document.getElementById('root');
const render = () => ReactDOM.render(<App />, rootEl)

render()
