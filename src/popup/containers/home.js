import React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'
import { Alert, Button, Select, Form, Input } from 'antd'

import './home.scss'
import * as actions from '../actions'
import { compose, setIn, updateIn } from '../../common/utils'
import UserInfo from '../components/user_info'
import ImageForm from '../components/image_form'
import API from '../../common/api/popup_api'
import { LINK_PAIR_STATUS } from '../../common/models/link_pair_model'

const relationships = [
  'Supports', 'Refutes', 'Models', 'Aggregates',
  'is Example of', 'is Metaphor for', 'is Instance of', 'is Member of'
]

const getValues = (comp, { validate = true } = {}) => {
  if (validate) {
    return new Promise((resolve, reject) => {
      comp.validateFields((err, values) => {
        if (err)  return reject(err)
        resolve(values)
      })
    })
  }

  return Promise.resolve(comp.getFieldsValue())
}

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
    const { links } = this.props.linkPair.data

    return (
      <div className="annotate-2 with-annotation">
        <div className="two-annotation">
          <div className="annotate-item">
            <ImageForm
              ref={ref => { this.linkForm1 = ref }}
              {...links[0]}
              onUpdateField={(val, key) => {
                console.log('val, key', val, key)
                this.props.setLinkPair(
                  setIn(['data', 'links', 0, key], val, this.props.linkPair)
                )
              }}
            />
          </div>
          <div className="annotate-item">
            <ImageForm
              ref={ref => { this.linkForm2 = ref }}
              {...links[1]}
              onUpdateField={(val, key) => {
                this.props.setLinkPair(
                  setIn(['data', 'links', 1, key], val, this.props.linkPair)
                )
              }}
            />
          </div>
        </div>
        <div className="actions">
          <Button
            type="primary"
            size="large"
            className="create-link-button"
            onClick={() => {
              const self = this

              return Promise.all([
                getValues(this.linkForm1),
                getValues(this.linkForm2)
              ])
              .then(tuple => {
                this.props.setLinkPair(
                  compose(
                    updateIn(
                      ['data', 'links'],
                      links => [
                        { ...links[0], ...tuple[0] },
                        { ...links[1], ...tuple[1] }
                      ]
                    ),
                    setIn(['status'], LINK_PAIR_STATUS.READY)
                  )(this.props.linkPair)
                )

                this.props.history.push('/create-link')
              })
              .catch(e => {
                console.log(e.error)
              })
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
    const { getFieldDecorator } = this.props.form
    const pair = this.props.linkPair.data

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
    const { userInfo, linkPair } = this.props

    if (!userInfo)  return null

    if (userInfo.user_activate === '0') {
      return this.renderUserNotActivated()
    }

    switch (linkPair && linkPair.status) {
      case LINK_PAIR_STATUS.EMPTY:      return this.renderNormal()
      case LINK_PAIR_STATUS.ONE:        return this.renderAnnotatedOne()
      case LINK_PAIR_STATUS.TWO:        return this.renderAnnotatedTwo()
      case LINK_PAIR_STATUS.READY:      return this.renderCreateLink()
      default:                          return 'Unknown status'
    }
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
    state => ({
      userInfo: state.userInfo,
      linkPair: state.linkPair
    }),
    dispatch => bindActionCreators({...actions}, dispatch)
  ),
  withRouter,
  Form.create()
)(Home)
