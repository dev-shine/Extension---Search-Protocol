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
import { LINK_PAIR_STATUS } from '../../common/models/local_model'

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

class AnnotateStepTwo extends React.Component {
  componentDidMount () {

  }

  render () {
    if (!this.props.linkPair) return null

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
                this.props.setLocalBridge(
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
                this.props.setLocalBridge(
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
                this.props.setLocalBridge(
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
              this.props.resetLocalBridge()
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
)(AnnotateStepTwo)
