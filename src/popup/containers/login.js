import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'
import { withRouter } from 'react-router-dom'
import { Button, Input, Form, Icon, Alert } from 'antd'
import { translate } from 'react-i18next'

import * as actions from '../actions'
import { compose } from '../../common/utils'
import Tab from '../components/tab'
import { notifySuccess } from '../../components/notification'
import Ext from '../../common/web_extension'
import API from '../../common/api/popup_api'
import './login.scss'

class __LoginForm extends React.Component {
  state = {
    errMsg: null,
    isSubmitting: false
  }

  handleSubmit = (e) => {
    const { t } = this.props

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

          notifySuccess(t('successfullyLoggedIn'))
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
    const { t } = this.props
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
                { required: true, message: t('loginRegister:emailRequiredErrMsg') },
                { type: 'email', message: t('loginRegister:emailFormatErrMsg') }
              ]
            })(
              <Input prefix={<Icon type="mail" style={{ fontSize: 13 }} />} placeholder={t('loginRegister:emailPlaceholder')} />
            )}
          </Form.Item>
          <Form.Item hasFeedback>
            {getFieldDecorator('password', {
              rules: [{ required: true, message: t('loginRegister:passwordErrMsg') }]
            })(
              <Input prefix={<Icon type="lock" style={{ fontSize: 13 }} />} type="password" placeholder={t('loginRegister:passwordPlaceholder')} />
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
              {t('loginRegister:login')}
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
    const { t } = this.props
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

          notifySuccess(t('successfullyRegistered'))
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
    const { t } = this.props
    const { getFieldDecorator } = this.props.form;
    const { errMsg } = this.state

    return (
      <div className="register-wrapper">
        <p className="hint">{t('loginRegister:registerHint')}</p>

        {errMsg && errMsg.length ? (
          <div className="error-message">
            <Alert message={errMsg} type="error" showIcon />
          </div>
        ) : null}

        <Form onSubmit={this.handleSubmit} className="register-form">
          <Form.Item hasFeedback>
            {getFieldDecorator('name', {
              rules: [
                { required: true, message: t('loginRegister:nameErrMsg') }
              ]
            })(
              <Input prefix={<Icon type="user" style={{ fontSize: 13 }} />} placeholder={t('loginRegister:namePlaceholder')} />
            )}
          </Form.Item>
          <Form.Item hasFeedback>
            {getFieldDecorator('email', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: t('loginRegister:emailRequiredErrMsg') },
                { type: 'email', message: t('loginRegister:emailFormatErrMsg') }
              ]
            })(
              <Input prefix={<Icon type="mail" style={{ fontSize: 13 }} />} placeholder={t('loginRegister:emailPlaceholder')} />
            )}
          </Form.Item>
          <Form.Item hasFeedback>
            {getFieldDecorator('password', {
              rules: [{ required: true, message: t('loginRegister:passwordErrMsg') }]
            })(
              <Input prefix={<Icon type="lock" style={{ fontSize: 13 }} />} type="password" placeholder={t('loginRegister:passwordPlaceholder')} />
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
                {t('loginRegister:register')}
              </Button>
              <Button
                type="primary"
                size="large"
                className="sign-in-with-google"
                onClick={() => API.openSocialLogin('google')}
              >
                {t('loginRegister:signInWithGoogle')}
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
  translate(['common', 'loginRegister']),
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
    const { t } = this.props
    const { tabName } = this.state

    return (
      <div className="login-register">
        <Tab
          className="login-tabs"
          activeName={tabName}
          onTabChange={name => {}}
        >
          <Tab.Pane name="register" tab={t('loginRegister:register')}>
            {this.renderRegisterForm()}
          </Tab.Pane>
          <Tab.Pane name="login" tab={t('loginRegister:login')}>
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
  translate(['common', 'loginRegister']),
  withRouter
)(Login)
