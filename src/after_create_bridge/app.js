import React, { Component } from 'react'
import { Checkbox, Button } from 'antd'
import { translate } from 'react-i18next'

import ipc from '../common/ipc/ipc_dynamic'
import API from 'cs_api'
import log from '../common/log'
import './app.scss'

class App extends Component {
  state = {
    hideAfterCreateMsg: false
  }

  render () {
    const { t } = this.props

    return (
      <div className="msg-wrapper">
        <p>
          {t('afterCreateBridge:awesomeText')}
        </p>

        <p>
          <b>{t('afterCreateBridge:pleaseText')}</b>
          <br/>a) {t('afterCreateBridge:callToAction1')}
          <br/>b) {t('afterCreateBridge:callToAction2')}
          <br/>c) {t('afterCreateBridge:callToAction3')}
          <br/>d) {t('afterCreateBridge:callToAction4')}
        </p>

        <p className="actions">
          <Checkbox
            onChange={(e) => {
              this.setState({ hideAfterCreateMsg: e.target.checked })

              API.updateUserSettings({ hideAfterCreateMsg: e.target.checked })
              .catch(e => {
                log.error(e.stack)
              })
            }}
            checked={this.state.hideAfterCreateMsg}
          >
            {t('afterCreateBridge:hideThisMessage')}
          </Checkbox>

          <Button type="primary" size="large" onClick={() => ipc.ask('CLOSE')}>
            {t('close')}
          </Button>
        </p>
      </div>
    )
  }
}

export default translate(['common', 'afterCreateBridge'])(App)
