import React, { Component } from 'react'
import { Modal, Select, Form, Input, Button, Icon } from 'antd'
import { translate } from 'react-i18next'

import { notifyError, notifySuccess } from '../components/notification'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import API from '../common/api/cs_iframe_api'
import { compose, updateIn } from '../common/utils'
import log from '../common/log'
import * as C from '../common/constant'
import './app.scss'

const ipc = ipcForIframe()

class App extends Component {
  state = {
    mode:       C.UPSERT_MODE.ADD,
    linkData:   null,
    noteCategories: [],
    privacy: 0
  }

  encodeData = (values) => {
    return compose(
      updateIn(['relation'], x => parseInt(x, 10)),
      updateIn(['privacy'], x => parseInt(x, 10))
    )(values)
  }

  decodeData = (values) => {
    return compose(
      updateIn(['relation'], x => x && ('' + x)),
      updateIn(['privacy'], x => x ? ('' + x) : '0')
    )(values)
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
      values = this.encodeData(values)

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

  onAddNoteCategory = () => {
    // ADD_CATEGORY
    ipc.ask('ADD_CATEGORY')
  }

  onUpdateField = (val, key) => {
    this.setState({ [key]: val })
  }

  componentDidMount () {
    ipc.ask('INIT')
    .then(({ annotationData = {}, linkData, mode, noteCategories }) => {
      log('init got annotation', linkData, annotationData, mode, noteCategories)
      this.setState({
        linkData,
        annotationData,
        mode,
        noteCategories
      })

      this.props.form.setFieldsValue(this.decodeData({
        title:    annotationData.title || '',
        desc:     annotationData.desc || linkData.text || '',
        tags:     annotationData.tags || '',
        privacy:  annotationData.privacy || '0',
        relation: annotationData ? annotationData.relation : undefined
      }))
    })

    ipc.onAsk((cmd, args) => {
      switch (cmd) {
        case 'SELECT_NEW_CATEGORY': { // SELECT_NEW_CATEGORY
          // log('SELECT_NEW_RELATION', cmd, args)
          this.setState({
            noteCategories: [...this.state.noteCategories, args.relation],
            selectedCategory: args.relation.id
          }, () => {
            this.props.form.setFieldsValue(this.decodeData({
              relation: args.relation.id
            }))
          })
          return true
        }
      }
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
                { required: true, message: t('createNote:noteErrMsg') },
                {
                  validator: (rule, value, callback) => {
                    const { linkData } = this.state
                    if (value === linkData.text) {
                      const msg = t('sameDescErrMsg')
                      return callback(msg)
                    }

                    callback()
                  }
                }
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
                placeholder={t('tagsPlaceholderAnnotation')}
                onChange={e => this.onUpdateField(e.target.value, 'tags')}
              />
            )}
          </Form.Item>
          <div style={{display:'flex', justifyContent: 'space-between'}}>
            <Form.Item label={t('privacy:privacyLabel')}>
              <div style={{ display: 'flex' }}>
                {getFieldDecorator('privacy', {
                  validateTrigger: ['onBlur'],
                  rules: [
                    { required: true, message: t('privacy:privacyErrMsg') }
                  ]
                })(
                  <Select
                    placeholder={t('privacy:privacyPlaceholder')}
                    onChange={val => {
                      this.props.form.setFieldsValue({
                        relation: ''
                      })
                      this.onUpdateField(parseInt(val, 10), 'privacy')
                      }
                    }
                    style={{ width: '150px' }}
                  >
                    {C.PRIVACY_LIST.map(p => (
                      <Select.Option key={p.value} value={'' + p.value}>{t(`privacy:${p.key}`)}</Select.Option>
                    ))}
                  </Select>
                )}
                </div>
            </Form.Item>

            <Form.Item label={t('createNote:relationLabel')}
            // className="relation-form-item"
            >
              {/* <div className="relationship-row"> */}
                {/* <div style={{ textAlign: 'center' }}> */}
                  <div style={{ display: 'flex' }}>
                    {getFieldDecorator('relation', {
                      ...(this.state.selectedCategory ? { initialValue: '' + this.state.selectedCategory } : {}),
                      rules: [
                        { required: true, message: t('createNote:relationErrMsg') }
                      ]
                    })(
                      <Select
                        placeholder={t('createNote:relationPlaceholder')}
                        onChange={val => this.onUpdateField(parseInt(val, 10), 'relation')}
                        style={{ width: '150px' }}
                      >
                        {this.state.noteCategories
                        .filter(n => (this.state.privacy === 0 && n.privacy !== 1) || this.state.privacy === 1)
                        .map(r => (
                          <Select.Option key={r.id} value={'' + r.id}>{r.name}</Select.Option>
                        ))}
                      </Select>
                    )}
                    <Button
                      type="default"
                      shape="circle"
                      onClick={this.onAddNoteCategory}
                      style={{ marginLeft: '10px' }}
                    >
                      <Icon type="plus" />
                    </Button>
                  </div>
                {/* </div> */}
              {/* </div> */}
            </Form.Item>
          </div>
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
  translate(['common', 'createNote', 'privacy'])
)(App)
