import React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'

import * as actions from '../actions'
import { compose } from '../../common/utils'
import * as API from '../../common/api/http_api'
import './user_info.scss'

class UserInfo extends React.Component {
  onClickLogout = () => {
    API.logout()
    this.props.setUserInfo(null)
  }

  render () {
    const { userInfo } = this.props
    if (!userInfo)  return null

    return (
      <div className="user-info">
        <div className="user-name-box">
          <span className="welcome">Welcome:</span>
          <span className="user-name">{userInfo.user_name}</span>
        </div>
        <div
          className="logout-button"
          role="button"
          onClick={this.onClickLogout}
        >
          Logout
        </div>
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
)(UserInfo)
