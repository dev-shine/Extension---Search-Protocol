import React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'
import { Checkbox, Form, InputNumber, Collapse, Select } from 'antd'
import { translate } from 'react-i18next'

import './settings.scss'
import * as actions from '../actions'
import { compose, setIn, updateIn } from '../../common/utils'
import API from '../../common/api/popup_api'
import log from '../../common/log'
import i18n, { languages } from '../../i18n'

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
    const { t } = this.props

    return (
      <div className="settings-page">
        <div className="logo-banner">
          <img src="./img/logo.png" />
        </div>
        <Collapse>
          <Collapse.Panel key="settings" header={t('settings')}>
            <Form className="settings-form">
              <Form.Item>
                <Checkbox
                  onChange={(e) => this.onChangeSettings('showOnLoad', e.target.checked)}
                  checked={this.state.settings.showOnLoad}
                >
                  {t('enableBridgit')}
                </Checkbox>
              </Form.Item>
              <Form.Item>
                <Checkbox
                  onChange={(e) => this.onChangeSettings('hideAfterCreateMsg', !e.target.checked)}
                  checked={!this.state.settings.hideAfterCreateMsg}
                >
                  {t('showTipsAfterCreateBridge')}
                </Checkbox>
              </Form.Item>
              <Form.Item label={t('language')}>
                <Select
                  value={this.state.settings.language}
                  onChange={lang => {
                    this.onChangeSettings('language', lang)
                    i18n.changeLanguage(lang)
                    API.changeLanguage(lang)
                  }}
                >
                  {languages.map(item => (
                    <Select.Option value={item.id} key={item.id}>
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label={t('showWithinInches')}>
                <InputNumber
                  onChange={value => this.onChangeSettings('nearDistanceInInch', parseFloat(value))}
                  value={this.state.settings.nearDistanceInInch || 0}
                  min={0}
                  max={5}
                  step={0.1}
                />
              </Form.Item>
              <Form.Item label={t('showActiveItemsForSeconds')}>
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
        <a
          className="feedback-link"
          target="_blank"
          href="https://join.slack.com/t/bridgit-feedback/shared_invite/enQtMzkxMTYyNzQ5MzQ3LWYxOTljMGY3MWExY2QwZmU2ZDQzMDM0ZjdmYTEzZTk5Y2JjZDgyNzM3YmU0NTIxMGY1ZDdjMzk0ZDNhNjVlZjE">
         Click here to provide Feedback
        </a>
      </div>
    )
  }
}

export default translate('settings')(Settings)
