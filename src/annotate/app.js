import React, { Component } from 'react'
import { Modal, Select, Form, Input, Button, Icon } from 'antd'
import { translate } from 'react-i18next'

import { notifyError, notifySuccess } from '../components/notification'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import API from '../common/api/cs_iframe_api'
import { compose, updateIn } from '../common/utils'
import log from '../common/log'
import * as C from '../common/constant'
import './app.scss'

const ipc = ipcForIframe()
let children = [];
class App extends Component {
  state = {
    mode:       C.UPSERT_MODE.ADD,
    linkData:   null,
    noteCategories: [],
    categories: [],
    privacy: 0,
    selectedCategory: '',
    isButtonDisabled: false
  }

  encodeData = (values) => {
    return compose(
      updateIn(['relation'], x => parseInt(x, 10)),
      updateIn(['category'], x => parseInt(x, 10)),
      updateIn(['sub_category'], x => x ),
      updateIn(['privacy'], x => parseInt(x, 10))
    )(values)
  }

  decodeData = (values) => {
    return compose(
      updateIn(['relation'], x => x && ('' + x)),
      updateIn(['category'], x => x && ('' + x)),
      updateIn(['sub_category'], x => x ),
      updateIn(['privacy'], x => x ? ('' + x) : '0')
    )(values)
  }

  onSubmitAdd = (values) => {
    const { t } = this.props

    API.createAnnotation({
      ...values,
      target: this.state.linkData
    })
    .then(annotation => {
      ipc.ask('DONE', { annotation })

      // Note: record last annotation, it will add 'build bridge' menu item for further selection on text / image
      // API.recordLastAnnotation({
      //   ...annotation,
      //   target: {
      //     ...this.state.linkData,
      //     id: annotation.target
      //   }
      // })
      notifySuccess(t('successfullySaved'))
      setTimeout(() => {
        this.onClickCancel();
        this.setState({isButtonDisabled: false});
      }, 1500)
    })
    .catch(e => {
      notifyError(e.message)
      this.setState({isButtonDisabled: false})
    })
  }

  onSubmitEdit = (values) => {
    const { t } = this.props

    log('onSubmitEdit', {
      ...values,
      target: this.state.annotationData.target
    })

    API.updateNote(this.state.annotationData.id, {
      ...values,
      target: this.state.annotationData.target
    })
    .then(annotation => {
      ipc.ask('DONE', { annotation })
      notifySuccess(t('successfullySaved'))
      setTimeout(() => { 
        this.onClickCancel()
        this.setState({isButtonDisabled: false})
        }, 1500)
    })
    .catch(e => {
      notifyError(e.message)
      this.setState({isButtonDisabled: false})
    })
  }

  onClickSubmit = () => {
    this.props.form.validateFields((err, values) => {
      values.sub_category = values.sub_category ? values.sub_category.join(",") : "";
      values.tags = values.tags ? values.tags.join(",") : "";
      
      if (err)  return
      this.setState({isButtonDisabled: true})
      values = this.encodeData(values)
      
      switch (this.state.mode) {
        case C.UPSERT_MODE.ADD:
          return this.onSubmitAdd(values)

        case C.UPSERT_MODE.EDIT:
          return this.onSubmitEdit(values)
      }
    })
  }

  onClickCancel = () => {
    ipc.ask('CLOSE')
  }

  onAddNoteCategory = () => {
    // ADD_NOTE_TYPE
    ipc.ask('ADD_NOTE_TYPE')
  }

  onAddSubCategory = () => {    
    // ADD_SUB_CATEGORY
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

  tagsApply = (category_id) => {
    this.bindTags(category_id);

    this.props.form.setFieldsValue({
      sub_category: undefined
    })
    this.onUpdateField(parseInt(category_id, 10), 'category')

  }

  onUpdateField = (val, key) => {
    
    this.setState({ 
      [key]: val,
      selectedCategory: (key === "category" ? val : this.state.selectedCategory)
     })
  }

  componentDidMount () {
    ipc.ask('INIT') 
    .then(({ annotationData = {}, linkData, mode, noteCategories, categories }) => {
      log('init got annotation', linkData, annotationData, mode, noteCategories, categories)
      this.setState({
        linkData,
        annotationData,
        mode,
        noteCategories,
        categories,
        selectedCategory: annotationData.category || ''
      })

      if (annotationData.category) this.bindTags(annotationData.category);
      this.props.form.setFieldsValue(this.decodeData({
        title:    annotationData.title || '',
        desc:     annotationData.desc || linkData.text || '',
        tags:     annotationData.tags ? annotationData.tags.split(",") : [],
        privacy:  annotationData.privacy || '0',
        relation: annotationData ? annotationData.relation : undefined,
        category: annotationData.category || undefined,
        sub_category: annotationData.sub_category ? annotationData.sub_category.toString().split(",") : [],
      })) 
    })

    ipc.onAsk((cmd, args) => {
      switch (cmd) {
        case 'SELECT_NEW_NOTE_TYPE': { // SELECT_NEW_NOTE_TYPE
          // log('SELECT_NEW_RELATION', cmd, args)
          this.setState({
            noteCategories: [...this.state.noteCategories, args.relation],
            selectedCategoryType: args.relation.id
          }, () => {
            this.props.form.setFieldsValue(this.decodeData({
              relation: args.relation.id
            }))
          })
          return true
        }

        case 'SELECT_NEW_SUB_CATEGORY': { // SELECT_NEW_NOTE_TYPE
          // log('SELECT_NEW_RELATION', cmd, args)
          const {sub_category} = args;
          this.state.categories.map(category => {
            if (category.id == sub_category.category_id)
              category.sub_category.push(sub_category);
          })

          this.setState({
            selectedCategory: sub_category.category_id
          }, () => {
            this.props.form.setFieldsValue(this.decodeData({
              category: sub_category.category_id || undefined,
              sub_category: [sub_category.id.toString()],
              relation: this.state.relation
            }))
          })
          return true
        }        
      }
    })
  }

  render () {
    const { t } = this.props
    const { getFieldDecorator } = this.props.form
    const { categories, selectedCategory, isButtonDisabled } = this.state

    return (
      <div className="annotation-wrapper">
        <Form>
          <Form.Item label={t('createNote:title')}>
            {getFieldDecorator('title', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: t('createNote:titleErrMsg') }
              ]
            })(
              <Input
                placeholder={t('createNote:titlePlaceholder')}
                onChange={e => this.onUpdateField(e.target.value, 'title')}
              />
            )}
          </Form.Item>
          <Form.Item label={t('createNote:note')}>
            {getFieldDecorator('desc', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: t('createNote:noteErrMsg') },
                {
                  validator: (rule, value, callback) => {
                    const { linkData } = this.state
                    if (value === linkData.text) {
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
                placeholder={t('createNote:notePlaceholder')}
                onChange={e => this.onUpdateField(e.target.value, 'desc')}
              />
            )}
          </Form.Item>
          <div style={{display:'flex', justifyContent: 'space-between'}}>
            <Form.Item label={t('privacy:privacyLabel')}>
              <div style={{ display: 'flex' }}>
                {getFieldDecorator('privacy', {
                  validateTrigger: ['onBlur'],
                  rules: [
                    { required: true, message: t('privacy:privacyErrMsg') }
                  ]
                })(
                  <Select
                    placeholder={t('privacy:privacyPlaceholder')}
                    onChange={val => {
                      this.props.form.setFieldsValue({
                        relation: ''
                      })
                      this.onUpdateField(parseInt(val, 10), 'privacy')
                      }
                    }
                    style={{ width: '200px' }}
                  >
                    {C.PRIVACY_LIST.map(p => (
                      <Select.Option key={p.value} value={'' + p.value}>{t(`privacy:${p.key}`)}</Select.Option>
                    ))}
                  </Select>
                )}
                </div>
            </Form.Item>

            <Form.Item label={t('createNote:relationLabel')}
            // className="relation-form-item"
            >
              {/* <div className="relationship-row"> */}
                {/* <div style={{ textAlign: 'center' }}> */}
                  <div style={{ display: 'flex' }}>
                    {getFieldDecorator('relation', {
                      ...(this.state.selectedCategoryType ? { initialValue: '' + this.state.selectedCategoryType } : {}),
                      rules: [
                        { required: true, message: t('createNote:relationErrMsg') }
                      ]
                    })(
                      <Select
                        placeholder={t('createNote:relationPlaceholder')}
                        onChange={val => this.onUpdateField(parseInt(val, 10), 'relation')}
                        style={{ width: '200px' }}
                      >
                        {this.state.noteCategories
                        .filter(n => (this.state.privacy === 0 && n.privacy !== 1) || this.state.privacy === 1)
                        .map(r => (
                          <Select.Option key={r.id} value={'' + r.id}>{r.name}</Select.Option>
                        ))}
                      </Select>
                    )}
                    <Button
                      type="default"
                      shape="circle"
                      onClick={this.onAddNoteCategory}
                      style={{ marginLeft: '10px' }}
                    >
                      <Icon type="plus" />
                    </Button>
                  </div>
                {/* </div> */}
              {/* </div> */}
            </Form.Item>
          </div>

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
                    onChange={val =>
                      this.tagsApply(val)
                      // this.props.form.setFieldsValue({
                      //   sub_category: undefined
                      // })
                      // this.onUpdateField(parseInt(val, 10), 'category')
                      // }
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

                    if (value.length > 5) {
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
              // <Input
              //   placeholder={t('tagsPlaceholderAnnotation')}
              //   onChange={e => this.onUpdateField(e.target.value, 'tags')}
              // />
            )}
          </Form.Item>


          <div className="actions">
            <Button
              type="primary"
              size="large"
              className="save-button"
              disabled={isButtonDisabled}
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
  translate(['common', 'createNote', 'privacy'])
)(App)
