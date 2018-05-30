import React from 'react'
import { withRouter, Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'
import { Icon } from 'antd'
import { translate } from 'react-i18next'

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
    const { userInfo, t } = this.props
    if (!userInfo)  return null

    return (
      <div className="user-info">
        <div className="user-name-box">
          <span className="welcome">{t('welcome')}:</span>
          <span className="user-name">{userInfo.name}</span>
        </div>
        <div className="actions">
          <Link to="/settings">
            <Icon type="setting" style={{ fontSize: '16px' }} />
          </Link>
          <div
            className="logout-button"
            role="button"
            onClick={this.onClickLogout}
          >
            {t('logout')}
          </div>
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
  translate('common'),
  withRouter
)(UserInfo)
