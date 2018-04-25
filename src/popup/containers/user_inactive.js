import React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'
import { Alert, Button, Select, Form, Input } from 'antd'

import './user_inactive.scss'

class UserInActivePage extends React.Component {
  render () {
    return (
      <div className="user-inactive-page">
        <Alert
          type="info"
          message={(
            <div>
              You're Almost Done! <br/>
              We just sent you a confirmation Email. Please verify your email to get started.
            </div>
          )}
        />
      </div>
    )
  }
}

export default UserInActivePage
