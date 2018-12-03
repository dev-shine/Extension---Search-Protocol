import React, { Component, Fragment } from 'react'
import { Form, Input, Button, Select, Icon, Row, Col } from 'antd'
import { translate } from 'react-i18next'
import { notifyError, notifySuccess } from '../components/notification'
import { compose } from '../common/utils'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import {
  FacebookShareButton,
  GooglePlusShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  EmailShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  EmailIcon,
  // share count
  FacebookShareCount,
  GooglePlusShareCount,
  LinkedinShareCount
} from 'react-share';
import API from '../common/api/cs_iframe_api'
// import { encodeElement } from '../common/api/backend_element_adaptor'
import log from '../common/log'
// import { ELEMENT_TYPE } from '../common/models/element_model'
import './app.scss'

const ipc = ipcForIframe()
const BASE_URL = 'https://demo.bridgit.io/'
const URL_PATTERN = {
  BRIDGE: BASE_URL + 'bridges/',
  NOTE: BASE_URL + 'notes/',
  ELEMENT: BASE_URL + 'elements/'
}

const sharePlatorm = {
  FACEBOK: '1',
  LINKEDIN: '2',
  TWITTER: '3'
}

const mailThrough = {
  EMAIL: 1,
  USER_NAME: 2
}

class App extends Component {
  state = {
    shareContent: {},
    email: null,
    user_ids: [],
    notes: null,
    type: '',
    isEmailSectionEnable: false,
    isBridgitSectionEnable: true,
    isLinkSectionEnabled: false,
    isSendEmailDisabled: true,
    isSendBridgitDisabled: true,
    followers: []
  }

  //type : 0= bridges, 1 = notes, 2 = content elements
 componentDidMount () {
  ipc.ask('INIT')
  .then(({shareContent, type, followers}) => {
    
    this.setState({
      shareContent,
      type,
      followers
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

formShow = (via) => {
  this.setState({
    isEmailSectionEnable: (via === "email") ? true : false,
    isBridgitSectionEnable: (via === "bridgit") ? true : false,
    isLinkSectionEnabled: (via === "link") ? true : false
  })
}

valueChange = (e) => {
  let buttonVisible = this.state.isSendEmailDisabled;
  if (e.target.name === "email") {
    let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    buttonVisible = !(re.test(String(e.target.value).toLowerCase()));
  }
  
  this.setState({
    [e.target.name]: e.target.value,
    isSendEmailDisabled: buttonVisible
  })
}

bridgitValueChange = (e) => {

  this.setState({
    [e.target.name]: e.target.value,
  })

}


sendMail = (method) => {
  const {email, notes, shareContent, type, user_ids} = this.state;
  let request_obj = {email, type, notes, id: shareContent.id};
  request_obj = mailThrough.EMAIL == method ? {...request_obj, email} : {...request_obj, user_ids: user_ids.join(",")};
  
  API.sendMail(request_obj)
  .then(data => {
    console.log(data);
    this.onClickCancel();
  })
  .catch(err => {
    console.log(err);
    this.onClickCancel();
  })
}


closeShareWindow = () => {
  setTimeout(() => {
    this.onClickCancel();
  }, 1000);
}

trackSocialShare = (social_type) => {
  let obj = {social_type, type: this.state.type, type_id: this.state.shareContent.id };
  API.trackSocialSiteCross(obj)
  .then(res => {
      // this.closeShareWindow();
  })
  .catch(err => {
    // this.closeShareWindow();
  })
}

renderShareContent = () => {
  const { t } = this.props
  const { shareContent, isEmailSectionEnable, isBridgitSectionEnable, isLinkSectionEnabled, isSendEmailDisabled, isSendBridgitDisabled, type, followers } = this.state
  
  const shareUrl = (type == '0') ? URL_PATTERN.BRIDGE + shareContent.id : URL_PATTERN.NOTE + shareContent.id;  

  return (
    <Fragment>
      <h3>Share With Your Friends on</h3><br/>

      <Row>
        <Col span="4">
          <div className="social-share">
              <img src="./img/old_icon.png" height="32" width="32" onClick={() => this.formShow("bridgit")}/>
          </div>
        </Col>

        <Col span="4">
          <div className="social-share">
              <FacebookShareButton
                url={shareUrl}
                quote={shareContent.desc}
                hashtag="#bridgit"
                windowHeight= {600}
                windowWidth= {600}
                onShareWindowClose = { () => this.trackSocialShare(sharePlatorm.FACEBOK) }
                className="social-share-button">
                <FacebookIcon
                  size={32}
                  round />
              </FacebookShareButton>

              <FacebookShareCount
                url={shareUrl}  
                className="social-share-count">
                {count => count }
              </FacebookShareCount>
          </div>
        </Col>

        <Col span="4">
          <div className="social-share">
            <LinkedinShareButton
              url={shareUrl}
              title={"TITLE"}
              windowHeight= {600}
              windowWidth= {600}
              description={shareContent.desc}
              onShareWindowClose = { () => this.trackSocialShare(sharePlatorm.LINKEDIN) }
              className="social-share-button">
              <LinkedinIcon
                size={32}
                round />
            </LinkedinShareButton>

            {/* <LinkedinShareCount
              url={shareUrl}
              className="social-share-count">
              {count => count}
            </LinkedinShareCount> */}
          </div>
        </Col>


        <Col span="4">
          <div className="social-share">
              <Icon type="mail" onClick={() => this.formShow("email")} style={{fontSize: 32}} />
            {/* <LinkedinShareCount
              url={shareUrl}
              className="social-share-count">
              {count => count}
            </LinkedinShareCount> */}
          </div>
        </Col>

        <Col span="4">
          <div className="social-share">
              <Icon type="link" onClick={() => this.formShow("link")} style={{fontSize: 32}} />
          </div>
        </Col>

        <Col span="4">
            <div className="social-share">
              <TwitterShareButton
                url={shareUrl}
                windowHeight= {600}
                windowWidth= {600}
                hashtags={["Bridgit"]}
                onShareWindowClose = { () => this.trackSocialShare(sharePlatorm.TWITTER) }
                className="social-share-button">
                <TwitterIcon
                  size={32}
                  round />
              </TwitterShareButton>

              <div className="social-share-count">
                &nbsp;
              </div>
            </div>
        </Col>

        </Row><br/>

      { isLinkSectionEnabled &&
        <div>
          <Row>
            <Col span="23"><Input name="web_url" id="web_url" value={shareUrl} /></Col>
            <Col span="1"><img src="./img/copy_icon.png" height="32" width="32" onClick={() => ipc.ask("COPIED_URL",{share_url: shareUrl}) }  /></Col>
          </Row>
          <br/>
        </div>
    }

      { isEmailSectionEnable &&
        <div>
          <Row>
            <Col span="20"><Input placeholder="Email" name="email" onChange={val => this.valueChange(val) }/></Col>
            <Col span="4"><Button type="primary" placeholder="Email" onClick={() => this.sendMail(mailThrough.EMAIL) } disabled={isSendEmailDisabled}>Send</Button></Col>
          </Row><br/>
          <Row>
            <Input.TextArea placeholder="Add Notes" name="notes" onChange={val => this.valueChange(val) }/><br/>
          </Row>
          <br/>
        </div>
      }


     { isBridgitSectionEnable &&
        <div>
          <Row>
            <Col span="20">
              {/* <Input placeholder="To: Name" name="user_name" onChange={val => this.bridgitValueChange(val) }/> */}

                  <Select
                    mode="multiple"
                    placeholder={"To: Name"} // need to be dynamic
                    onChange={val => {

                      const isButtonDisabled = (val.length === 0) ? true : false;

                      this.setState({
                        isSendBridgitDisabled : isButtonDisabled,
                        user_ids: val
                      })
                      this.state.user_ids
                    }}
                    style={{ width: '375px' }}
                  >
                    {
                    followers.map(follower => {
                      return (
                        <Select.Option key={follower.name} value={'' + follower.id}>{follower.name}</Select.Option>
                    )})}
                  </Select>

            </Col>
            <Col span="4"><Button type="primary" placeholder="Email" onClick={() => this.sendMail(mailThrough.USER_NAME) } disabled={isSendBridgitDisabled}>Send</Button></Col>
          </Row><br/>
          <Row>
            <Input.TextArea placeholder="Add a Note ..." name="notes" onChange={val => this.bridgitValueChange(val) }/><br/>
          </Row>
          <br/>
        </div>
        }

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
