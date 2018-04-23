import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'
import { Button, Input, Form, Icon, Alert } from 'antd'

import * as actions from '../actions'
import { compose } from '../../common/utils'
import Tab from '../components/tab'
import './login.scss'

class __LoginForm extends React.Component {
  state = {
    errMsg: null,
    isSubmitting: false
  }

  render () {
    const { getFieldDecorator } = this.props.form;
    const { errMsg } = this.state

    return (
      <div className="login-wrapper">
        {errMsg && errMsg.length ? (
          <div className="error-message">
            <Alert message={errMsg} type="error" showIcon />
          </div>
        ) : null}

        <Form onSubmit={this.handleSubmit} className="login-form">
          <Form.Item hasFeedback>
            {getFieldDecorator('email', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: 'Please input your email' },
                { type: 'email', message: 'invalid email' }
              ]
            })(
              <Input prefix={<Icon type="mail" style={{ fontSize: 13 }} />} placeholder="Email" />
            )}
          </Form.Item>
          <Form.Item hasFeedback>
            {getFieldDecorator('password', {
              rules: [{ required: true, message: 'Please input your Password' }]
            })(
              <Input prefix={<Icon type="lock" style={{ fontSize: 13 }} />} type="password" placeholder="Password" />
            )}
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              size="large"
              className="login-form-button"
              loading={this.state.isSubmitting}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </div>
    )
  }
}

class __RegisterForm extends React.Component {
  state = {
    errMsg: null,
    isSubmitting: false
  }

  render () {
    const { getFieldDecorator } = this.props.form;
    const { errMsg } = this.state

    return (
      <div className="register-wrapper">
        <p className="hint">To start sharing with Bridgit, give us a little info.</p>

        {errMsg && errMsg.length ? (
          <div className="error-message">
            <Alert message={errMsg} type="error" showIcon />
          </div>
        ) : null}

        <Form onSubmit={this.handleSubmit} className="register-form">
          <Form.Item hasFeedback>
            {getFieldDecorator('fullName', {
              rules: [
                { required: true, message: 'Please input your full name' }
              ]
            })(
              <Input prefix={<Icon type="user" style={{ fontSize: 13 }} />} placeholder="Full name" />
            )}
          </Form.Item>
          <Form.Item hasFeedback>
            {getFieldDecorator('email', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: 'Please input your email' },
                { type: 'email', message: 'invalid email' }
              ]
            })(
              <Input prefix={<Icon type="mail" style={{ fontSize: 13 }} />} placeholder="Email" />
            )}
          </Form.Item>
          <Form.Item hasFeedback>
            {getFieldDecorator('password', {
              rules: [{ required: true, message: 'Please input your Password' }]
            })(
              <Input prefix={<Icon type="lock" style={{ fontSize: 13 }} />} type="password" placeholder="Password" />
            )}
          </Form.Item>
          <Form.Item>
            <div className="actions">
              <Button
                type="primary"
                size="large"
                className="register-form-button"
                loading={this.state.isSubmitting}
              >
                Register
              </Button>
              <Button
                type="primary"
                size="large"
                className="sign-in-with-google"
                loading={this.state.isSubmitting}
              >
                Sign in with Google
              </Button>
            </div>
          </Form.Item>
        </Form>
      </div>
    )
  }
}

const LoginForm     = Form.create()(__LoginForm)
const RegisterForm  = Form.create()(__RegisterForm)

class Login extends React.Component {
  state = {
    tabName: 'register'
  }

  renderLoginForm () {
    return (
      <LoginForm />
    )
  }

  renderRegisterForm () {
    return (
      <RegisterForm />
    )
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

export default compose(
  connect(
    state => ({}),
    dispatch => bindActionCreators({...actions}, dispatch)
  )
)(Login)
