import React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'
import { Form, Input } from 'antd'

import * as actions from '../actions'
import { compose } from '../../common/utils'
import './image_form.scss'

class ImageForm extends React.Component {
  getValues () {

  }

  render () {
    const { image } = this.props
    const { getFieldDecorator } = this.props.form;

    return (
      <div className="image-form">
        <Form>
          <Form.Item>
            <div className="image-box">
              <img src={image} className="the-image" />
            </div>
          </Form.Item>
          <Form.Item label="Description">
            {getFieldDecorator('desc', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: 'Please input description' }
              ]
            })(
              <Input.TextArea placeholder="Enter Description For This Content" />
            )}
          </Form.Item>
          <Form.Item label="Tags">
            {getFieldDecorator('tags', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: 'Please input tags' }
              ]
            })(
              <Input placeholder="Separate Tags By Commas" />
            )}
          </Form.Item>
        </Form>
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
)(ImageForm)
