import React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'
import { Alert, Button, Select, Form, Input } from 'antd'

import './annotate.scss'
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

class CreateLink extends React.Component {
  render () {
    if (!this.props.linkPair) return null

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
)(CreateLink)
