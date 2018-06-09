import React from 'react'
import ReactDOM from 'react-dom'
import App from './app'
import API from 'cs_api'
import i18n from '../i18n'

const rootEl = document.getElementById('root');
const render = () => ReactDOM.render(<App />, rootEl)

render()

if (API.getUserSettings) {
  API.getUserSettings()
  .then(settings => {
    i18n.changeLanguage(settings.language)
  })
}
