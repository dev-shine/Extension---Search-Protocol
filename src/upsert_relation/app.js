import React, { Component } from 'react'
import { Modal, Form, Input, Button, Icon } from 'antd'
import { translate } from 'react-i18next'

import { ipcForIframe } from '../common/ipc/cs_postmessage'
import { setIn, updateIn, compose } from '../common/utils'
import API from '../common/api/cs_api'
import log from '../common/log'
import { notifyError, notifySuccess } from '../components/notification'
import './app.scss'

const ipc = ipcForIframe()

class App extends Component {
  onClickSubmit = () => {
    const { t } = this.props

    this.props.form.validateFields((err, values) => {
      if (err)  return

      API.createRelation(values)
      .then(relation => {
        ipc.ask('DONE_UPSERT_RELATION', { relation })
        notifySuccess(t('successfullySaved'))
        setTimeout(() => this.onClickCancel(), 1500)
      })
    })
  }

  onClickCancel = () => {
    ipc.ask('CLOSE_UPSERT_RELATION')
  }

  render () {
    const { t } = this.props
    const { getFieldDecorator } = this.props.form

    return (
      <div className="upsert-relation-wrapper">
        <h2>{t('upsertRelation:addRelation')}</h2>
        <Form>
          <Form.Item label={t('upsertRelation:activeName')}>
            {getFieldDecorator('active_name', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: t('upsertRelation:activeNameErrMsg') }
              ]
            })(
              <Input
                placeholder={t('upsertRelation:activeNamePlaceholder')}
              />
            )}
          </Form.Item>
          <Form.Item label={t('upsertRelation:passiveName')}>
            {getFieldDecorator('passive_name', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: t('upsertRelation:passiveNameErrMsg') }
              ]
            })(
              <Input
                placeholder={t('upsertRelation:passiveNamePlaceholder')}
              />
            )}
          </Form.Item>
          <div className="actions">
            <Button
              type="primary"
              size="large"
              className="save-button"
              onClick={this.onClickSubmit}
            >
              {t('save')}
            </Button>
            <Button
              type="danger"
              size="large"
              className="cancel-button"
              onClick={this.onClickCancel}
            >
              {t('cancel')}
            </Button>
          </div>
        </Form>
      </div>
    )
  }
}

export default compose(
  Form.create(),
  translate(['common', 'upsertRelation'])
)(App)
