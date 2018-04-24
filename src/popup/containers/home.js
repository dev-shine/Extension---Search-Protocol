import React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'
import { Alert, Button } from 'antd'

import './home.scss'
import * as actions from '../actions'
import { compose } from '../../common/utils'
import UserInfo from '../components/user_info'
import API from '../../common/api/popup_api'

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

  renderContent () {
    const { userInfo } = this.props

    if (!userInfo)  return null

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
  withRouter
)(Home)
