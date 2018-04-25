import React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'
import { Alert, Button, Select, Form, Input } from 'antd'

import './home.scss'
import * as actions from '../actions'
import { compose } from '../../common/utils'
import UserInfo from '../components/user_info'
import ImageForm from '../components/image_form'
import API from '../../common/api/popup_api'

const relationships = [
  'Supports', 'Refutes', 'Models', 'Aggregates',
  'is Example of', 'is Metaphor for', 'is Instance of', 'is Member of'
]

class Home extends React.Component {
  componentDidMount () {
    if (!this.props.userInfo) {
      this.props.history.push('/login')
    }
  }

  componentWillReceiveProps (nextProps) {
    if (!nextProps.userInfo) {
      this.props.history.push('/login')
    }
  }

  renderUserNotActivated () {
    return (
      <Alert
        type="info"
        message={(
          <div>
            You're Almost Done! <br/>
            We just sent you a confirmation Email. Please verify your email to get started.
          </div>
        )}
      />
    )
  }

  renderNormal () {
    return (
      <div className="annotate-0">
        <div className="one-line-button">
          <Button
            type="primary"
            size="large"
            className="build-link-button"
            onClick={() => {
              API.startAnnotationOnCurrentTab()
              .then(() => {
                window.close()
              })
            }}
          >
            Build A Link
          </Button>
        </div>
        <div className="one-line-button">
          <Button
            type="primary"
            size="large"
            className="show-links-button"
            onClick={() => {}}
          >
            Bridgit Specs
          </Button>
        </div>
      </div>
    )
  }

  renderAnnotatedOne () {
    return (
      <div className="annotate-1 with-annotation">
        <div className="two-annotation">
          <div className="annotate-item">
            <ImageForm
              image="http://h.hiphotos.baidu.com/image/h%3D300/sign=d9d2e0ddb5014a909e3e40bd99763971/21a4462309f790525fe7185100f3d7ca7acbd5e1.jpg"
            />
          </div>
          <div className="annotate-item">
            <p>Select content from another source in order to build this link</p>
            <Button
              type="primary"
              size="large"
              className="build-link-button"
              onClick={() => {
                API.startAnnotationOnCurrentTab()
                .then(() => {
                  window.close()
                })
              }}
            >
              Select Another Link
            </Button>
          </div>
        </div>
        <div className="actions">
          <Button
            type="danger"
            size="large"
            className="cancel-button"
            onClick={() => {
              console.log('todo: cancel')
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  renderAnnotatedTwo () {
    return (
      <div className="annotate-2 with-annotation">
        <div className="two-annotation">
          <div className="annotate-item">
            <ImageForm
              image="http://h.hiphotos.baidu.com/image/h%3D300/sign=d9d2e0ddb5014a909e3e40bd99763971/21a4462309f790525fe7185100f3d7ca7acbd5e1.jpg"
            />
          </div>
          <div className="annotate-item">
            <ImageForm
              image="http://h.hiphotos.baidu.com/image/h%3D300/sign=d9d2e0ddb5014a909e3e40bd99763971/21a4462309f790525fe7185100f3d7ca7acbd5e1.jpg"
            />
          </div>
        </div>
        <div className="actions">
          <Button
            type="primary"
            size="large"
            className="create-link-button"
            onClick={() => {
              console.log('todo: create link')
            }}
          >
            Build Link
          </Button>
          <Button
            type="danger"
            size="large"
            className="cancel-button"
            onClick={() => {
              console.log('todo: cancel')
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  renderCreateLink () {
    const { getFieldDecorator } = this.props.form;

    return (
      <div className="to-create-link">
        <h2>Create Link</h2>
        <Form onSubmit={this.handleSubmit} className="create-link-form">
          <Form.Item label="How are these links related?">
            <div className="relationship-row">
              <div className="image-box">
                <img src="http://h.hiphotos.baidu.com/image/h%3D300/sign=d9d2e0ddb5014a909e3e40bd99763971/21a4462309f790525fe7185100f3d7ca7acbd5e1.jpg" />
              </div>

              <div>
                {getFieldDecorator('relationship', {
                  rules: [
                    { required: true, message: 'Please select relation' }
                  ]
                })(
                  <Select placeholder="Choose a relationship">
                    {relationships.map(r => (
                      <Select.Option key={r} value={r}>{r}</Select.Option>
                    ))}
                  </Select>
                )}
              </div>

              <div className="image-box">
                <img src="http://h.hiphotos.baidu.com/image/h%3D300/sign=d9d2e0ddb5014a909e3e40bd99763971/21a4462309f790525fe7185100f3d7ca7acbd5e1.jpg" />
              </div>
            </div>
          </Form.Item>

          <Form.Item label="What do you want to say about this link?">
            {getFieldDecorator('desc', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: 'Please input description' }
              ]
            })(
              <Input.TextArea placeholder="Enter Description For This Link" />
            )}
          </Form.Item>
          <Form.Item label="Tags">
            {getFieldDecorator('tags', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: 'Please input tags' }
              ]
            })(
              <Input placeholder="Supporting information, opposing information, data, another perspective, etc." />
            )}
          </Form.Item>
        </Form>

        <div className="actions">
          <Button
            type="primary"
            size="large"
            className="post-button"
            onClick={() => {
              console.log('todo: post')
            }}
          >
            POST IT!
          </Button>
          <Button
            type="danger"
            size="large"
            className="cancel-button"
            onClick={() => {
              console.log('todo: cancel')
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  renderContent () {
    const { userInfo } = this.props

    if (!userInfo)  return null

    return this.renderCreateLink()

    return this.renderAnnotatedTwo()

    if (userInfo.user_activate === '0') {
      return this.renderUserNotActivated()
    }

    return this.renderNormal()
  }

  render () {
    const { userInfo } = this.props

    return (
      <div className="home">
        <UserInfo />
        {this.renderContent()}
      </div>
    )
  }
}

export default compose(
  connect(
    state => ({ userInfo: state.userInfo }),
    dispatch => bindActionCreators({...actions}, dispatch)
  ),
  withRouter,
  Form.create()
)(Home)
