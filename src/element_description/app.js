import React, { Component, Fragment } from 'react'
import { Form, Input, Button, Select, Icon } from 'antd'
import { translate } from 'react-i18next'
import { notifyError, notifySuccess } from '../components/notification'
import { compose } from '../common/utils'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import API from '../common/api/cs_iframe_api'
import { encodeElement } from '../common/api/backend_element_adaptor'
import log from '../common/log'
import { ELEMENT_TYPE } from '../common/models/element_model'
import './app.scss'

let children = [];
const ipc = ipcForIframe()
class App extends Component {
  state = {
    elementData: {},
    categories: [],
    selectedCategory: '',
    disableInputs: true,
    disableSaveButton: false
  }

  followUnFollowElement = (linkData) => {
    const { t } = this.props
    API.elementFollow({element_id: linkData.id})
    .then(() => {
      let successMessage = linkData.is_follow ? t('Successfully Unfollowed') : t('Successfully Followed')
      notifySuccess(successMessage)
      ipc.ask('DONE')
      setTimeout(() => this.onClickCancel(), 3500)
    })
    .catch(e => {
      notifyError(e.message)
      setTimeout(() => this.onClickCancel(), 3500)
    })
  }
 componentDidMount () {
  ipc.ask('INIT')
  .then(({linkData, categories}) => {
    
    this.setState({
      elementData: linkData,
      categories: categories
    })
    if (linkData.name) {
      this.followUnFollowElement(linkData)
    } else {
      this.setState({
        disableInputs: false
      })
      this.props.form.setFieldsValue({
        title: linkData.name,
        desc: linkData.desc || linkData.text || ''
      })
    }
  })

  ipc.onAsk((cmd, args) => {
    switch (cmd) {

      case 'SELECT_NEW_SUB_CATEGORY': { 
        const {sub_category} = args;
        this.state.categories.map(category => {
          if (category.id == sub_category.category_id)
            category.sub_category.push(sub_category);
        })

        this.setState({
          selectedCategory: sub_category.category_id
        }, () => {
          this.props.form.setFieldsValue({
            category: sub_category.category_id || undefined,
            sub_category: [sub_category.id.toString()]
          })
        })
        return true
      }
    }
  })

 }
 onClickCancel = () => {
  ipc.ask('CLOSE')
}

 createElementDescription = (dataValues, linkData) => {
  const { t } = this.props
  API.createElementDescription(dataValues)
  .then(() => {
    notifySuccess(t('successfullySaved'))
    this.followUnFollowElement(linkData)
    this.setState({disableSaveButton: true})
  })
  .catch(e => {
    notifyError(e.message)
    this.setState({disableSaveButton: false})
    // setTimeout(() => this.onClickCancel(), 1500)
  })
 }
 onClickSubmit = () => {
  const { elementData: linkData, disableSaveButton } = this.state
  this.props.form.validateFields((err, values) => {
    if (err)  return
    this.setState({disableSaveButton: true})
    const { t } = this.props
    let dataValues = {...values}
    dataValues.name = values.title
    dataValues.element_id = linkData.id
    dataValues.sub_category = dataValues.sub_category.join(",");
    dataValues.tags = dataValues.tags.join(",");
    if (!linkData.id) {
      API.createElement(encodeElement(linkData))
      .then((newElementData) => {
        dataValues.element_id = newElementData.id
        linkData.id = newElementData.id
        this.createElementDescription(dataValues, linkData)
      })
      .catch(e => {
        notifyError(e.message)
      })
    } else {
      this.createElementDescription(dataValues, linkData)
    }
  });
}

onAddSubCategory = () => {
  ipc.ask('ADD_SUB_CATEGORY',{selected_category: this.props.form.getFieldValue('category') || ''});
}

bindTags = (category_id) => {
  children = []
  this.state.categories.map(category => {
    if (category.id == category_id && category.tags && category.tags.length > 0) {
      let tags = category.tags;
      let category_tag_length = tags.length;
      for (let i = 0; i < category_tag_length; i++) tags[i] ? children.push(<Select.Option key={tags[i]}>{tags[i]}</Select.Option>) : '';
    }
  })

}

onUpdateField = (val, key) => {
  this.setState({
     [key]: val,
     selectedCategory: (key === "category" ? val : this.state.selectedCategory)
    })
}
renderForm = () => {
  const { t } = this.props
  const { getFieldDecorator } = this.props.form
  const { disableInputs, categories, selectedCategory, disableSaveButton } = this.state
  return (
    <Fragment>
      <h3>
        {t('elementDescription:defineElementBeforeFollow')}
      </h3>
      <Form>
        <Form.Item label={t('elementDescription:titleLabel')}>
          {getFieldDecorator('title', {
            validateTrigger: ['onBlur'],
            rules: [
              { required: true, message: t('elementDescription:titleErrMsg') }
            ]
          })(
            <Input
              placeholder={t('elementDescription:titlePlaceholder')}
              onChange={e => this.onUpdateField(e.target.value, 'title')}
              disabled={disableInputs}
            />
          )}
        </Form.Item>
        <Form.Item label={t('elementDescription:descLabel')}>
          {getFieldDecorator('desc', {
            validateTrigger: ['onBlur'],
            rules: [
              { required: true, message: t('elementDescription:descErrMsg') },
              {
                validator: (rule, value, callback) => {
                  const { elementData } = this.state
                  if (value === elementData.text) {
                    const msg = t('sameDescErrMsg')
                    return callback(msg)
                  }

                  callback()
                }
              }
            ]
          })(
            <Input.TextArea
              rows={4}
              placeholder={t('elementDescription:descPlaceholder')}
              onChange={e => this.onUpdateField(e.target.value, 'desc')}
              disabled={disableInputs}
            />
          )}
        </Form.Item>

        <div style={{display:'flex', justifyContent: 'space-between'}}>
          <Form.Item label={t('contentCategory:categorylabel')}>
            <div style={{ display: 'flex' }}>
              {getFieldDecorator('category', {
                validateTrigger: ['onBlur'],
                rules: [
                  { required: true, message: t('contentCategory:categoryErrMsg') }
                ]
              })(
                <Select
                  placeholder={t('contentCategory:categoryPlaceholder')}
                  onChange={val => {
                    this.bindTags(val);
                    this.props.form.setFieldsValue({
                      sub_category: undefined
                    })
                    this.onUpdateField(parseInt(val, 10), 'category')
                    }
                  }
                  style={{ width: '200px' }}
                >
                  {categories.map((category) => (
                    <Select.Option key={category.id} value={'' + category.id}>{category.name}</Select.Option>
                  ))}
                </Select>
              )}
            </div>
          </Form.Item>

          <Form.Item label={t('subCategory:subCategorylabel')}>
            <div style={{ display: 'flex' }}>
              {getFieldDecorator('sub_category', {
                validateTrigger: ['onBlur'],
                rules: [
                  { required: true, message: t('subCategory:subCategoryErrMsg') }
                ]
              })(
                <Select
                  mode="multiple"
                  placeholder={t('subCategory:subCategoryPlaceholder')}
                  onChange={val => {
                    this.onUpdateField(parseInt(val, 10), 'sub_category')
                    }
                  }
                  style={{ width: '200px' }}
                >
                  {selectedCategory != '' &&
                  categories.filter(category => category.id == selectedCategory)[0].
                  sub_category.map(SC => {
                    return (
                      <Select.Option key={SC.id} value={'' + SC.id}>{SC.name}</Select.Option>
                  )})}
                </Select>
              )}
                <Button
                  type="default"
                  shape="circle"
                  onClick={this.onAddSubCategory}
                  style={{ marginLeft: '10px' }}
                >
                  <Icon type="plus" />
                </Button>
            </div>
          </Form.Item>
          </div>

          <Form.Item label={t('tags')}>
            {getFieldDecorator('tags', {
              validateTrigger: ['onBlur'],
              rules: [
                {
                  required: true,
                  message: t('tagsRequiredErrMsg')
                },
                {
                  validator: (rule, value, callback) => {
                    // const parts = value.split(',')
                    
                    if (value && value.length > 5) {
                      const msg = t('tagsCountErrMsg')
                      return callback(msg)
                    }

                    callback()
                  }
                }
              ]
            })(

              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder={t('tagsPlaceholderAnnotation')}
                onChange={val => this.onUpdateField(val, 'tags')}
              >
                {children}
              </Select>,
            )}
          </Form.Item>

        <div className="actions">
          <Button
            type="primary"
            size="large"
            className="save-button"
            disabled={disableSaveButton}
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
    </Fragment>
  )
}
renderInfo = () => {
  const { t } = this.props
  const { elementData } = this.state
  return (
    <Fragment>
      <h3>
        You will receive notifications when information is added or edited for the element
        <span style={{fontWeight:'bold'}}> {elementData.name} </span>
      </h3>
    </Fragment>
  )
}
  render () {
    const { elementData, disableInputs } = this.state
    return (
      <div className='element-wrapper'>
        <div className='element-image'>
          {
            elementData.type === ELEMENT_TYPE.SELECTION
            ? <div className='selection-text'>
              {elementData.text}
            </div>
            : <img alt={elementData.name ? elementData.name : 'Element image'} src={elementData.image} />
          }
        </div>
        {!disableInputs
          ? this.renderForm()
          : this.renderInfo()
        }
      </div>
    )
  }
}

export default compose(
  Form.create(),
  translate(['common', 'elementDescription'])
)(App)
