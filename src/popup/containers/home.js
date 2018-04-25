import React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'
import { Alert, Button, Select, Form, Input } from 'antd'

import './home.scss'
import * as actions from '../actions'
import { compose, setIn, updateIn } from '../../common/utils'
import API from '../../common/api/popup_api'
import { notifyError, notifySuccess } from '../../components/notification'

class Home extends React.Component {
  onClickLoadLinks = () => {
    API.loadLinksForCurrentPage()
    .then(links => {
      notifySuccess('Found Bridgit links. Please wait', 'Success', { duration: 1500 })
      API.askCurrentTab('SHOW_LINKS', { links })
    })
    .catch(e => {
      notifyError(e.message)
    })
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
            onClick={this.onClickLoadLinks}
          >
            Bridgit Specs
          </Button>
        </div>
      </div>
    )
  }

  render () {
    const { userInfo } = this.props

    return (
      <div className="home">
        {this.renderNormal()}
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
