import React, { Component } from 'react'
import { Modal, Select, Form, Input, Button } from 'antd'
import { translate } from 'react-i18next'

import { notifyError, notifySuccess } from '../components/notification'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import API from '../common/api/cs_iframe_api'
import { compose } from '../common/utils'
import log from '../common/log'
import * as C from '../common/constant'
import './app.scss'

const ipc = ipcForIframe()

class App extends Component {
  state = {
    mode:       C.UPSERT_MODE.ADD,
    linkData:   null
  }

  onSubmitAdd = (values) => {
    const { t } = this.props

    API.createAnnotation({
      ...values,
      target: this.state.linkData
    })
    .then(annotation => {
      ipc.ask('DONE', { annotation })

      // Note: record last annotation, it will add 'build bridge' menu item for further selection on text / image
      API.recordLastAnnotation({
        ...annotation,
        target: {
          ...this.state.linkData,
          id: annotation.target
        }
      })
      notifySuccess(t('successfullySaved'))
      setTimeout(() => this.onClickCancel(), 1500)
    })
    .catch(e => {
      notifyError(e.message)
    })
  }

  onSubmitEdit = (values) => {
    const { t } = this.props

    log('onSubmitEdit', {
      ...values,
      target: this.state.annotationData.target
    })

    API.updateNote(this.state.annotationData.id, {
      ...values,
      target: this.state.annotationData.target
    })
    .then(annotation => {
      ipc.ask('DONE', { annotation })
      notifySuccess(t('successfullySaved'))
      setTimeout(() => this.onClickCancel(), 1500)
    })
    .catch(e => {
      notifyError(e.message)
    })
  }

  onClickSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (err)  return

      switch (this.state.mode) {
        case C.UPSERT_MODE.ADD:
          return this.onSubmitAdd(values)

        case C.UPSERT_MODE.EDIT:
          return this.onSubmitEdit(values)
      }
    })
  }

  onClickCancel = () => {
    ipc.ask('CLOSE')
  }

  onUpdateField = (val, key) => {
    this.setState({ [key]: val })
  }

  componentDidMount () {
    ipc.ask('INIT')
    .then(({ annotationData = {}, linkData, mode }) => {
      log('init got annotation', linkData, annotationData, mode)
      this.setState({ linkData, annotationData, mode })

      this.props.form.setFieldsValue({
        title:  annotationData.title || '',
        desc:   annotationData.desc || '',
        tags:   annotationData.tags || ''
      })
    })
  }

  render () {
    const { t } = this.props
    const { getFieldDecorator } = this.props.form

    return (
      <div className="annotation-wrapper">
        <Form>
          <Form.Item label={t('createNote:title')}>
            {getFieldDecorator('title', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: t('createNote:titleErrMsg') }
              ]
            })(
              <Input
                placeholder={t('createNote:titlePlaceholder')}
                onChange={e => this.onUpdateField(e.target.value, 'title')}
              />
            )}
          </Form.Item>
          <Form.Item label={t('createNote:note')}>
            {getFieldDecorator('desc', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: t('createNote:noteErrMsg') }
              ]
            })(
              <Input.TextArea
                rows={4}
                placeholder={t('createNote:notePlaceholder')}
                onChange={e => this.onUpdateField(e.target.value, 'desc')}
              />
            )}
          </Form.Item>
          <Form.Item label={t('tags')}>
            {getFieldDecorator('tags', {
              validateTrigger: ['onBlur'],
              rules: [
                {
                  required: true,
                  message: t('tagsRequiredErrMsg')
                },
                {
                  validator: (rule, value, callback) => {
                    const parts = value.split(',')

                    if (parts.length > 5) {
                      const msg = t('tagsCountErrMsg')
                      return callback(msg)
                    }

                    callback()
                  }
                }
              ]
            })(
              <Input
                placeholder={t('tagsPlaceholder')}
                onChange={e => this.onUpdateField(e.target.value, 'tags')}
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
  translate(['common', 'createNote'])
)(App)
