import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'
import { withRouter } from 'react-router-dom'
import { Button, Input, Form, Icon, Alert } from 'antd'

import * as actions from '../actions'
import { compose } from '../../common/utils'
import Tab from '../components/tab'
import { notifySuccess } from '../../components/notification'
import * as API from '../../common/api/http_api'
import './login.scss'

class __LoginForm extends React.Component {
  state = {
    errMsg: null,
    isSubmitting: false
  }

  handleSubmit = (e) => {
    if (e) e.preventDefault()

    this.props.form.validateFieldsAndScroll((err, values) => {
      if (err)  return;

      this.setState({
        errMsg: null,
        isSubmitting: true
      })

      return API.login({
        email: values.email,
        password: values.password
      })
      .then(
        (data) => {
          this.setState({ isSubmitting: false })
          this.props.setUserInfo(data)

          notifySuccess(`Successfully signed in. Welcome back`)
          setTimeout(() => {
            this.props.history.push('/')
          }, 1000)
        },
        (e) => {
          this.setState({
            errMsg: e.message,
            isSubmitting: false
          })
        }
      )
    })
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
              htmlType="submit"
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

  handleSubmit = (e) => {
    if (e) e.preventDefault()

    this.props.form.validateFieldsAndScroll((err, values) => {
      console.log('handleRegister', err, values)
      if (err)  return;

      this.setState({
        errMsg: null,
        isSubmitting: true
      })

      return API.register({
        name: values.name,
        email: values.email,
        password: values.password
      })
      .then(
        (data) => {
          this.setState({ isSubmitting: false })
          this.props.setUserInfo(data)

          notifySuccess(`Successfully registered`)
          setTimeout(() => {
            this.props.history.push('/')
          }, 1000)
        },
        (e) => {
          this.setState({
            errMsg: e.message,
            isSubmitting: false
          })
        }
      )
    })
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
                htmlType="submit"
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

const decorate = klass => compose(
  connect(
    state => ({ userInfo: state.userInfo }),
    dispatch => bindActionCreators({...actions}, dispatch)
  ),
  withRouter,
  Form.create()
)(klass)

const LoginForm     = decorate(__LoginForm)
const RegisterForm  = decorate(__RegisterForm)

class Login extends React.Component {
  state = {
    tabName: 'register'
  }

  componentDidMount () {
    if (this.props.userInfo) {
      this.props.history.push('/')
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.userInfo) {
      this.props.history.push('/')
    }
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
    state => ({ userInfo: state.userInfo }),
    dispatch => bindActionCreators({...actions}, dispatch)
  ),
  withRouter
)(Login)
