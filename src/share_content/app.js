import React, { Component, Fragment } from 'react'
import { Form, Input, Button, Select } from 'antd'
import { translate } from 'react-i18next'
import { notifyError, notifySuccess } from '../components/notification'
import { compose } from '../common/utils'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import {
  FacebookShareButton,
  GooglePlusShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  TelegramShareButton,
  WhatsappShareButton,
  // icons
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  // share count
  FacebookShareCount,
  GooglePlusShareCount,
  LinkedinShareCount,
  // PinterestShareButton,
  // RedditShareButton,
  // TumblrShareButton,
  // LivejournalShareButton,
  // MailruShareButton,
  // ViberShareButton,
  // WorkplaceShareButton,
  EmailShareButton
} from 'react-share';
import API from '../common/api/cs_iframe_api'
// import { encodeElement } from '../common/api/backend_element_adaptor'
import log from '../common/log'
// import { ELEMENT_TYPE } from '../common/models/element_model'
import './app.scss'

const ipc = ipcForIframe()
const SHARE_TYPE = {
  BRIDGE: 0,
  NOTE: 1,
  ELEMENT: 2
}
const BASE_URL = 'https://demo.bridgit.io/'
const URL_PATTERN = {
  BRIDGE: BASE_URL + 'bridges/',
  NOTE: BASE_URL + 'notes/',
  ELEMENT: BASE_URL + 'elements/'
}

class App extends Component {
  state = {
    shareContent: {}
  }
 componentDidMount () {
  ipc.ask('INIT')
  .then(({shareContent}) => {
    debugger;
    this.setState({
      shareContent
    })
  })
 }
 onClickCancel = () => {
  ipc.ask('CLOSE')
}
onUpdateField = (val, key) => {
  this.setState({ [key]: val })
}
// renderForm = () => {
//   const { t } = this.props
//   const { getFieldDecorator } = this.props.form
//   const { content } = this.state
//   return (
//     <Fragment>
//       <h3>
//         {content.type === 0 ? t('flagContent:headingBridge') : t('flagContent:headingNote')}
//       </h3>
//       <Form>
//         <Form.Item label={t('flagContent:categoryLabel')}>
//           <div style={{ display: 'flex' }}>
//             {getFieldDecorator('report', {
//               validateTrigger: ['onBlur'],
//               rules: [
//                 { required: true, message: t('flagContent:categoryErrMsg') }
//               ]
//             })(
//               <Select
//                 placeholder={t('flagContent:categoryPlaceholder')}
//                 onChange={val => this.onUpdateField(val, 'report')}
//               >
//                 {selectCategories.map(p => (
//                   <Select.Option key={p} value={p}>{p}</Select.Option>
//                 ))}
//               </Select>
//             )}
//             </div>
//           </Form.Item>
//         <Form.Item label={t('flagContent:commentLabel')}>
//           {getFieldDecorator('comment')(
//             <Input.TextArea
//               rows={4}
//               // placeholder={t('elementDescription:descPlaceholder')}
//               onChange={e => this.onUpdateField(e.target.value, 'comment')}
//               // disabled={disableInputs}
//             />
//           )}
//         </Form.Item>
//         <div className="actions">
//           <Button
//             type="primary"
//             size="large"
//             className="save-button"
//             disabled={!this.state.report}
//             onClick={this.onClickSubmit}
//           >
//             {t('save')}
//           </Button>
//           <Button
//             type="danger"
//             size="large"
//             className="cancel-button"
//             onClick={this.onClickCancel}
//           >
//             {t('cancel')}
//           </Button>
//         </div>
//       </Form>
//     </Fragment>
//   )
// }
renderShareContent = () => {
  const { t } = this.props
  const { shareContent } = this.state
  const title = 'Something to share'
  const shareUrl = URL_PATTERN.BRIDGE + shareContent.id
  return (
    <Fragment>
      <h3>Share With Your Friends on</h3>
      <div>
      <div className="social-share">
          <FacebookShareButton
            url={shareUrl}
            quote={title}
            className="social-share-button">
            <FacebookIcon
              size={32}
              round />
          </FacebookShareButton>

          <FacebookShareCount
            url={shareUrl}
            className="social-share-count">
            {count => count}
          </FacebookShareCount>
        </div>

        <div className="social-share">
          <TwitterShareButton
            url={shareUrl}
            title={title}
            className="social-share-button">
            <TwitterIcon
              size={32}
              round />
          </TwitterShareButton>

          <div className="social-share-count">
            &nbsp;
          </div>
        </div>
      </div>
      <div className="actions">
          <Button
            type="danger"
            size="large"
            className="cancel-button"
            onClick={this.onClickCancel}
          >
            {t('cancel')}
          </Button>
        </div>
    </Fragment>
  )
}
  render () {
    return (
      <div className='element-wrapper'>
        {this.renderShareContent()}
      </div>
    )
  }
}

export default compose(
  translate(['common'])
)(App)
