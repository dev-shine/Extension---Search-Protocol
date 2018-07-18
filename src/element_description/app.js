import React, { Component } from 'react'
import { Modal, Select, Form, Input, Button, Icon } from 'antd'
import { translate } from 'react-i18next'
import { notifyError, notifySuccess } from '../components/notification'
import { compose } from '../common/utils'
// import ipc from '../common/ipc/ipc_dynamic'
// import API from 'cs_api'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import API from '../common/api/cs_iframe_api'
import log from '../common/log'
import './app.scss'

const ipc = ipcForIframe()

class App extends Component {
  state = {
    elementData: {}
  }
 componentDidMount () {
  ipc.ask('INIT')
  .then(({linkData}) => {
    this.setState({
      elementData: linkData
    })
    this.props.form.setFieldsValue({
      title: '',
      desc: ''
    })
  })
 }
 onClickCancel = () => {
  ipc.ask('CLOSE')
}
 onClickSubmit = () => {
  this.props.form.validateFields((err, values) => {
    if (err)  return
    const { t } = this.props
    console.log('=====values entered====', values)
    notifySuccess(t('successfullySaved'))
    setTimeout(() => this.onClickCancel(), 1500)
  });
}
onUpdateField = (val, key) => {
  this.setState({ [key]: val })
}
  render () {
    const { t } = this.props
    const { getFieldDecorator } = this.props.form
    const { elementData } = this.state
    return (
      <div className='element-wrapper'>
        <div className='element-image'>
          <img src={elementData.image} />
        </div>
        <Form>
          <Form.Item label={t('elementDescription:titleLabel')}>
            {getFieldDecorator('title', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: t('elementDescription:titleErrMsg') }
              ]
            })(
              <Input
                placeholder={t('elementDescription:titlePlaceholder')}
                onChange={e => this.onUpdateField(e.target.value, 'title')}
              />
            )}
          </Form.Item>
          <Form.Item label={t('elementDescription:descLabel')}>
            {getFieldDecorator('desc', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: t('elementDescription:descErrMsg') }
              ]
            })(
              <Input.TextArea
                rows={4}
                placeholder={t('elementDescription:descPlaceholder')}
                onChange={e => this.onUpdateField(e.target.value, 'desc')}
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
  translate(['common', 'elementDescription'])
)(App)
