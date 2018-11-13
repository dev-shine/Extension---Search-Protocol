import React, { Component } from 'react'
import { Modal, Form, Input, Button, Select } from 'antd'
import { translate } from 'react-i18next'

import { ipcForIframe } from '../common/ipc/cs_postmessage'
import { setIn, updateIn, compose } from '../common/utils'
import API from 'cs_api'
import log from '../common/log'
import { notifyError, notifySuccess } from '../components/notification'
import './app.scss'

const ipc = ipcForIframe()

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      categories: [],
      category_id: '',
      name: ''
    }

    ipc.ask('REQUEST_SELECTED_CATEGORY')
    .then(result => {
      this.setState({
        categories: result.categories
      }, () => {
        this.props.form.setFieldsValue({category_id: result.selected_category.toString() || undefined})
      })
    })
  }

  onClickSubmit = () => {
    const { t } = this.props

    this.props.form.validateFields((err, values) => {
      if (err)  return
      
      API.createSubCategory(values)
      .then(sub_category => {
        ipc.ask('DONE_SUB_CATEGORY', { sub_category })
        notifySuccess(t('successfullySaved'))
        setTimeout(() => this.onClickCancel(), 1500)
      })
      .catch(err => notifyError(t(err.toString())))
    })
  }

  onClickCancel = () => {
    ipc.ask('CLOSE_SUB_CATEGORY')
  }

  onUpdateField = (key, val) => {
    this.setState({
      [key]: val
    })
  }

  render () {
    const { categories } = this.state
    const { t } = this.props
    const { getFieldDecorator } = this.props.form

    return (
      <div className="upsert-relation-wrapper">
        <h2>{t('subCategory:addSubCategory')}</h2>
        <Form>


            <Form.Item label={t('contentCategory:categorylabel')}>
              <div style={{ display: 'flex' }}>
                {getFieldDecorator('category_id', {
                  rules: [
                    { required: true, message: t('contentCategory:categoryErrMsg') }
                  ]
                })(
                <Select
                  placeholder={t('contentCategory:categoryPlaceholder')}
                  onChange={val => this.onUpdateField('category_id', parseInt(val, 10) )}
                >
                  {categories.map((category) => (
                    <Select.Option key={category.id} value={'' + category.id}>{category.name}</Select.Option>
                  ))}
                    </Select>
                )}

              </div>
            </Form.Item>


          <Form.Item label={t('subCategory:name')}>
            {getFieldDecorator('name', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: t('subCategory:nameErrMsg') }
              ]
            })(
              <Input
                onChange={val => this.onUpdateField('name', parseInt(val, 10) )}
                placeholder={t('subCategory:namePlaceHolder')}
              />
            )}
          </Form.Item>
          <div className="actions">
            <Button
              type="primary"
              size="large"
              className="save-button"
              onClick={this.onClickSubmit}
            >
              {t('save')}
            </Button>
            <Button
              type="danger"
              size="large"
              className="cancel-button"
              onClick={this.onClickCancel}
            >
              {t('cancel')}
            </Button>
          </div>
        </Form>
      </div>
    )
  }
}

export default compose(
  Form.create(),
  translate(['common', 'subCategory'])
)(App)
