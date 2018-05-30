import React from 'react'
import ReactDOM from 'react-dom'
import App from './app'
import '../i18n'

const rootEl = document.getElementById('root');
const render = () => ReactDOM.render(<App />, rootEl)

render()
