import React, { Component } from 'react'
import { Modal, Form, Input, Button, Icon } from 'antd'
import { translate } from 'react-i18next'

import { ipcForIframe } from '../common/ipc/cs_postmessage'
import { setIn, updateIn, compose } from '../common/utils'
import API from 'cs_api'
import log from '../common/log'
import { notifyError, notifySuccess } from '../components/notification'
import './app.scss'

const ipc = ipcForIframe()

class App extends Component {
  onClickSubmit = () => {
    const { t } = this.props

    this.props.form.validateFields((err, values) => {
      if (err)  return

      API.createNoteCategory(values)
      .then(relation => {
        ipc.ask('DONE_UPSERT_NOTE_TYPE', { relation })
        notifySuccess(t('successfullySaved'))
        setTimeout(() => this.onClickCancel(), 1500)
      })
    })
  }

  onClickCancel = () => {
    ipc.ask('CLOSE_UPSERT_NOTE_TYPE')
  }

  render () {
    const { t } = this.props
    const { getFieldDecorator } = this.props.form

    return (
      <div className="upsert-relation-wrapper">
        <h2>{t('upsertNoteType:addCategory')}</h2>
        <Form>
          <Form.Item label={t('upsertNoteType:name')}>
            {getFieldDecorator('name', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: t('upsertNoteType:nameErrMsg') }
              ]
            })(
              <Input
                placeholder={t('upsertNoteType:namePlaceHolder')}
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
  translate(['common', 'upsertNoteType'])
)(App)
