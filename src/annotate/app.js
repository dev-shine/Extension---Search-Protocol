import React, { Component } from 'react'
import { Modal, Select, Form, Input, Button } from 'antd'
import { notifyError, notifySuccess } from '../components/notification'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import API from '../common/api/cs_iframe_api'
import './app.scss'

const ipc = ipcForIframe()

class App extends Component {
  state = {
    linkData: null
  }

  onClickSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (err)  return

      API.createAnnotation({
        ...values,
        target: this.state.linkData
      })
      .then(annotation => {
        ipc.ask('DONE')

        // Note: record last annotation, it will add 'build bridge' menu item for further selection on text / image
        API.recordLastAnnotation({
          ...annotation,
          target: {
            ...this.state.linkData,
            id: annotation.target
          }
        })
        notifySuccess('Successfully saved')
        setTimeout(() => this.onClickCancel(), 1500)
      })
      .catch(e => {
        notifyError(e.message)
      })
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
    .then(linkData => {
      console.log('init got annotation', linkData)
      this.setState({ linkData })

      this.props.form.setFieldsValue({
        title:  linkData.title || '',
        desc:   linkData.desc || '',
        tags:   linkData.desc || ''
      })
    })
  }

  render () {
    const { getFieldDecorator } = this.props.form

    return (
      <div className="annotation-wrapper">
        <Form>
          <Form.Item label="Title">
            {getFieldDecorator('title', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: 'Please input title' }
              ]
            })(
              <Input
                placeholder="Enter Title For This Content"
                onChange={e => this.onUpdateField(e.target.value, 'title')}
              />
            )}
          </Form.Item>
          <Form.Item label="Note">
            {getFieldDecorator('desc', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: 'Please enter the text of your Note here' }
              ]
            })(
              <Input.TextArea
                rows={4}
                placeholder="Enter Note for this content"
                onChange={e => this.onUpdateField(e.target.value, 'desc')}
              />
            )}
          </Form.Item>
          <Form.Item label="Tags">
            {getFieldDecorator('tags', {
              validateTrigger: ['onBlur'],
              rules: [
                {
                  required: true,
                  message: 'Please input tags'
                },
                {
                  validator: (rule, value, callback) => {
                    const parts = value.split(',')

                    if (parts.length > 5) {
                      const msg = 'Enter up to 5 tags separated by commas'
                      return callback(msg)
                    }

                    callback()
                  }
                }
              ]
            })(
              <Input
                placeholder="Enter up to 5 tags separated by commas"
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
              Save
            </Button>
            <Button
              type="danger"
              size="large"
              className="cancel-button"
              onClick={this.onClickCancel}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </div>
    )
  }
}

export default Form.create()(App)
