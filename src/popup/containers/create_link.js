import React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'
import { Alert, Button, Select, Form, Input } from 'antd'

import './annotate.scss'
import * as actions from '../actions'
import { compose, setIn, updateIn } from '../../common/utils'
import { notifyError, notifySuccess } from '../../components/notification'
import CreateLinkComp from '../../components/create_link'
import API from '../../common/api/popup_api'

const relationships = [
  'Supports', 'Refutes', 'Models', 'Aggregates',
  'is Example of', 'is Metaphor for', 'is Instance of', 'is Member of'
]

class CreateLink extends React.Component {
  onClickSubmit = (data) => {
    API.postLinks(data)
    .then(() => {
      notifySuccess('Successfully posted')
      setTimeout(() => this.props.resetLinkPair(), 1500)
    })
    .catch(e => {
      notifyError(e.message)
    })
  }

  onUpdateField = (val, field) => {
    this.props.setLinkPair(
      setIn(['data', field], val, this.props.linkPair)
    )
  }

  render () {
    return (
      <CreateLinkComp
        linkPair={this.props.linkPair}
        onUpdateField={this.onUpdateField}
        onSubmit={this.onClickSubmit}
        onCancel={() => this.props.resetLinkPair()}
      />
    )
  }
}

export default compose(
  connect(
    state => ({
      linkPair: state.linkPair
    }),
    dispatch => bindActionCreators({...actions}, dispatch)
  ),
  withRouter,
  Form.create()
)(CreateLink)
