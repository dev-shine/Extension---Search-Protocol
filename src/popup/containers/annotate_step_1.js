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

class AnnotateStepOne extends React.Component {
  componentDidMount () {

  }

  render () {
    if (!this.props.linkPair) return null

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
)(AnnotateStepOne)
