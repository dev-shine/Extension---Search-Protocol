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
    const olStyle = {
      fontWeight: 'bold',
      listStyle: 'decimal',
      marginBottom: '15px',
      paddingLeft: '15px'
    }
    const normalStyle = {
      fontWeight: 'initial'
    }
    const ulStyle = {
      listStyle: 'disc',
      margin: '9px 35px'
    }
    return (
      <div className="msg-wrapper">
        <p>
          {t('afterCreateBridge:awesomeText')}
        </p>
        {/* <b>{t('afterCreateBridge:pleaseText')}</b> <br/> */}
        <ol style={olStyle}>
          <li>{t('afterCreateBridge:callToAction1')}</li>
          <li>
            {t('afterCreateBridge:callToAction2')}
            <ul style={ulStyle}>
              <li>{t('afterCreateBridge:callToAction2ah')} {' '} <span style={normalStyle}>{t('afterCreateBridge:callToAction2at')} </span></li>
              <li>{t('afterCreateBridge:callToAction2bh')} {' '} <span style={normalStyle}>{t('afterCreateBridge:callToAction2bt')} </span></li>
              <li>{t('afterCreateBridge:callToAction2ch')} {' '} <span style={normalStyle}>{t('afterCreateBridge:callToAction2ct')} </span></li>
              <li>{t('afterCreateBridge:callToAction2dh')} {' '} <span style={normalStyle}>{t('afterCreateBridge:callToAction2dt')} </span></li>
            </ul>
          </li>
          <li>{t('afterCreateBridge:callToAction3')}</li>
        </ol>
          {/* a) {t('afterCreateBridge:callToAction1')}
          <br/>b) {t('afterCreateBridge:callToAction2')}
          <br/>c) {t('afterCreateBridge:callToAction3')}
          <br/>d) {t('afterCreateBridge:callToAction4')} */}

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
