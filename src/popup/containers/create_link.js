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
import { notifyError, notifySuccess } from '../../components/notification'
import API from '../../common/api/popup_api'
import { LINK_PAIR_STATUS } from '../../common/models/link_pair_model'

const relationships = [
  'Supports', 'Refutes', 'Models', 'Aggregates',
  'is Example of', 'is Metaphor for', 'is Instance of', 'is Member of'
]

class CreateLink extends React.Component {
  onClickSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (err)  return
      const pair = this.props.linkPair.data

      API.postLinks({...pair, ...values})
      .then(() => {
        notifySuccess('Successfully posted')
      })
      .catch(e => {
        notifyError(e.message)
      })
    })
  }

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
                <img src={pair.links[0].image} />
              </div>

              <div>
                {getFieldDecorator('relationship', {
                  ...(pair.relationship ? { initialValue: pair.relationship } : {}),
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
                <img src={pair.links[1].image} />
              </div>
            </div>
          </Form.Item>

          <Form.Item label="What do you want to say about this link?">
            {getFieldDecorator('desc', {
              initialValue: pair.desc,
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
              initialValue: pair.tags,
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
            onClick={this.onClickSubmit}
          >
            POST IT!
          </Button>
          <Button
            type="danger"
            size="large"
            className="cancel-button"
            onClick={() => {
              API.clearLinks()
              .then(() => {
                this.props.setLinkPair({
                  status: LINK_PAIR_STATUS.EMPTY,
                  data: { links: [] }
                })
              })
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
