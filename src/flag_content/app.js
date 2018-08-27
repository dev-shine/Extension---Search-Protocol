import React, { Component, Fragment } from 'react'
import { Form, Input, Button, Select } from 'antd'
import { translate } from 'react-i18next'
import { notifyError, notifySuccess } from '../components/notification'
import { compose } from '../common/utils'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import API from '../common/api/cs_iframe_api'
import { encodeElement } from '../common/api/backend_element_adaptor'
import log from '../common/log'
import { ELEMENT_TYPE } from '../common/models/element_model'
import './app.scss'

const ipc = ipcForIframe()

// const noteCategories = [
//   'sexual content',
//   'violent content',
//   'hate speech',
//   'language issues',
//   'gibberish'
// ]
// const bridgeCategories = [
//   'inaccurate relationship',
//   'problematic content',
//   'subpar content element placement',
//   'language issues, gibberish'
// ]

const NOTE_CATEGORY_COUNT = 5
const BRIDGE_CATEGORY_COUNT = 4
class App extends Component {
  state = {
    content: {
      type: 0
    },
    report: ''
  }

 constructor (props) {
  super(props)
  const { t } = props
   this.noteCategories = t(`flagContent:noteCategory`, { returnObjects: true })
   this.bridgeCategories = t(`flagContent:bridgeCategory`, { returnObjects: true })
 }
 componentDidMount () {
  ipc.ask('INIT')
  .then(({content}) => {
    this.setState({
      content
    })
  })
 }
 onClickCancel = () => {
  ipc.ask('CLOSE')
}

 onClickSubmit = () => {
   const { t } = this.props
   const dataValues = {
     comment: this.state.comment,
     report: this.state.report,
     ...this.state.content
   }
   API.contentReport(dataValues)
   .then(() => {
     notifySuccess(t('flagContent:successfullyFlagged'))
     setTimeout(() => ipc.ask('DONE'), 3500)
   })
   .catch(e => {
     notifyError(e.message)
     setTimeout(() => ipc.ask('CLOSE'), 3500)
   })
}
onUpdateField = (val, key) => {
  this.setState({ [key]: val })
}
renderForm = () => {
  const { t } = this.props
  const { getFieldDecorator } = this.props.form
  const { content } = this.state
  const selectCategories = content.type === 0 ? this.bridgeCategories : this.noteCategories;
  return (
    <Fragment>
      <h3>
        {content.type === 0 ? t('flagContent:headingBridge') : t('flagContent:headingNote')}
      </h3>
      <Form>
        <Form.Item label={t('flagContent:categoryLabel')}>
          <div style={{ display: 'flex' }}>
            {getFieldDecorator('report', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: t('flagContent:categoryErrMsg') }
              ]
            })(
              <Select
                placeholder={t('flagContent:categoryPlaceholder')}
                onChange={val => this.onUpdateField(val, 'report')}
              >
                {selectCategories.map(p => (
                  <Select.Option key={p} value={p}>{p}</Select.Option>
                ))}
              </Select>
            )}
            </div>
          </Form.Item>
        <Form.Item label={t('flagContent:commentLabel')}>
          {getFieldDecorator('comment')(
            <Input.TextArea
              rows={4}
              // placeholder={t('elementDescription:descPlaceholder')}
              onChange={e => this.onUpdateField(e.target.value, 'comment')}
              // disabled={disableInputs}
            />
          )}
        </Form.Item>
        <div className="actions">
          <Button
            type="primary"
            size="large"
            className="save-button"
            disabled={!this.state.report}
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
    </Fragment>
  )
}
  render () {
    return (
      <div className='element-wrapper'>
        {this.renderForm()}
      </div>
    )
  }
}

export default compose(
  Form.create(),
  translate(['common', 'flagContent'])
)(App)
