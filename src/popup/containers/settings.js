import React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'
import { Checkbox, Form, InputNumber, Collapse } from 'antd'

import './settings.scss'
import * as actions from '../actions'
import { compose, setIn, updateIn } from '../../common/utils'
import API from '../../common/api/popup_api'
import log from '../../common/log'

class Settings extends React.Component {
  state = {
    ready: false,
    settings: {}
  }

  onChangeSettings = (key, val) => {
    const old = this.state.settings[key]

    this.setState(
      setIn(['settings', key], val, this.state)
    )

    API.updateUserSettings({ [key]: val })
    .catch(e => {
      log.error(e.stack)
    })
  }

  componentDidMount () {
    API.getUserSettings()
    .then(settings => this.setState({ settings, ready: true }))
  }

  render () {
    return (
      <div className="settings-page">
        <div className="logo-banner">
          <img src="./img/logo_banner.jpg" />
        </div>
        <Collapse>
          <Collapse.Panel key="settings" header="Settings">
            <Form className="settings-form">
              <Form.Item>
                <Checkbox
                  onChange={(e) => this.onChangeSettings('showOnLoad', e.target.checked)}
                  checked={this.state.settings.showOnLoad}
                >
                  Enable Bridgit
                </Checkbox>
              </Form.Item>
              <Form.Item>
                <Checkbox
                  onChange={(e) => this.onChangeSettings('hideAfterCreateMsg', !e.target.checked)}
                  checked={!this.state.settings.hideAfterCreateMsg}
                >
                  Show tips after 'create bridge'
                </Checkbox>
              </Form.Item>
              <Form.Item label="Show if cursor is within X inches">
                <InputNumber
                  onChange={value => this.onChangeSettings('nearDistanceInInch', parseFloat(value))}
                  value={this.state.settings.nearDistanceInInch || 0}
                  min={0}
                  max={5}
                  step={0.1}
                />
              </Form.Item>
              <Form.Item label="Display active items for Y seconds">
                <InputNumber
                  onChange={value => this.onChangeSettings('nearVisibleDuration', parseFloat(value))}
                  value={this.state.settings.nearVisibleDuration || 0}
                  min={0}
                  max={100}
                />
              </Form.Item>
            </Form>
          </Collapse.Panel>
        </Collapse>
      </div>
    )
  }
}

export default Settings
