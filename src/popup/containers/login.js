import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'

import * as actions from '../actions'
import Tab from '../components/tab'
import './login.scss'

class Login extends React.Component {
  state = {
    tabName: 'register'
  }

  renderLoginForm () {
    return 'login'
  }

  renderRegisterForm () {
    return 'register'
  }

  render () {
    const { tabName } = this.state

    return (
      <div className="login-register">
        <Tab
          className="login-tabs"
          activeName={tabName}
          onTabChange={name => {}}
        >
          <Tab.Pane name="register" tab="Register">
            {this.renderRegisterForm()}
          </Tab.Pane>
          <Tab.Pane name="login" tab="Sign In">
            {this.renderLoginForm()}
          </Tab.Pane>
        </Tab>
      </div>
    )
  }
}

export default connect(
  state => ({}),
  dispatch => bindActionCreators({...actions}, dispatch)
)(Login)
