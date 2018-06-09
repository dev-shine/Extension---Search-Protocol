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
import { LOCAL_BRIDGE_STATUS } from '../../common/models/local_model'

class AnnotateStepOne extends React.Component {
  componentDidMount () {

  }

  render () {
    if (!this.props.linkPair) return null

    const { links } = this.props.linkPair.data

    return (
      <div className="annotate-1 with-annotation">
        <div className="two-annotation">
          <div className="annotate-item">
            <ImageForm
              {...links[0]}
              onUpdateField={(val, key) => {
                console.log('val, key', val, key)
                this.props.setLocalBridge(
                  setIn(['data', 'links', 0, key], val, this.props.linkPair)
                )
              }}
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
              API.resetLocalBridge()
              .then(() => {
                this.props.resetLocalBridge()
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
)(AnnotateStepOne)
