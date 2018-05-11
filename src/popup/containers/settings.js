import React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'
import { Checkbox, Form, InputNumber } from 'antd'

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
      <Form className="settings-form">
        <Form.Item>
          <Checkbox
            onChange={(e) => this.onChangeSettings('showOnLoad', e.target.checked)}
            checked={this.state.settings.showOnLoad}
          >
            Show anntations and bridges on each page load
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
      </Form>

    )
  }
}

export default Settings
