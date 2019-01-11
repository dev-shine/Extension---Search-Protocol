import React, { Component } from 'react'
import { Drawer, Form, Input, Button, Select, Icon } from 'antd'
import { translate } from 'react-i18next'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import { setIn, updateIn, compose } from '../common/utils'
import * as C from '../common/constant'
import API from 'cs_api'
import './app.scss'

const ipc = ipcForIframe()

let children = [];
class ListElement extends Component {

    constructor(props) {
        super(props);
        this.state = {
            list: props.list,
            element_id: props.element_id,
            categories: [],
            selectedCategory: undefined,
            isButtonDisabled: false
        }
    }

    componentDidMount() {

        const {list} = this.state;
        const category = list.category ? list.category.toString() : undefined;

        this.props.form.setFieldsValue({
            title: list.title || '',
            desc: list.desc || '',
            privacy: list.privacy !== undefined ? list.privacy.toString() : '1',
            tags: list.tags ? list.tags.split(",") : [],
        })

        API.getCategories()
        .then((categories) => {

            this.props.form.setFieldsValue({
                category,
                sub_category: list.sub_category ? list.sub_category.split(",") : [],
            })
            this.setState({
                categories,
                selectedCategory: category
            })
                    
        })

        ipc.onAsk((cmd, args) => {
            switch (cmd) {
      
              case 'SELECT_NEW_SUB_CATEGORY': { // SELECT_NEW_NOTE_TYPE

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
                    sub_category: [sub_category.id.toString()],
                  })
                })
                return true
              }
            }
        })

    }

    isPublic = (val) => {
        let isPublic = false;

        C.PRIVACY_LIST.map(privacy => {
            if (privacy.key === "public" && privacy.value == val) {
                isPublic = true;
            } 
        })
        return isPublic;
    }

    onClickSubmit = () => {
        this.props.form.validateFields((err, values) => {
            const {list, element_id} = this.state
            values.category = values.category ? parseInt(values.category) : "";
            values.sub_category = values.sub_category ? values.sub_category.join(",") : "";
            values.tags = values.tags ? values.tags.join(",") : "";
            if (err) return
            values.target = element_id;
            this.setState({isButtonDisabled: true})
            let result;
            if (list)
                result = API.updateList(list.id, values)
            else
                result = API.createList(values)
            result.then(result => {
                ipc.ask("LIST_CREATED")
                setTimeout(() => {
                    this.setState({isButtonDisabled: false})
                    this.props.onListCancel();
                }, 1500);
            })
            .catch(err => {
                console.log(err)
                this.setState({isButtonDisabled: false})
            })

        })
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

    onAddSubCategory = () => {    
        // ADD_SUB_CATEGORY
        ipc.ask('ADD_SUB_CATEGORY',{selected_category: this.props.form.getFieldValue('category') || '', categories: this.state.categories});
    }

    render() {
        const { t, onListCancel } = this.props
        const { getFieldDecorator, getFieldValue } = this.props.form
        const {list, categories, selectedCategory, isButtonDisabled} = this.state;

        return (
            <Drawer
            title= {"List"}
            placement="left"
            width={350}
            closable={true}
            visible={true}
            onClose = {onListCancel}
            >

                <React.Fragment>

                    <Form>
                        <Form.Item label={t('listElement:titleLabel')}>
                            {getFieldDecorator('title', {
                            validateTrigger: ['onBlur'],
                            rules: [
                                { required: true, message: t('listElement:titleErrMsg') },
                                {max: 25},
                                {pattern: RegExp("^[a-zA-Z]."), message: t('listElement:titlePatternErrMsg')}
                            ]
                            })(
                            <Input
                                placeholder={t('listElement:titlePlaceholder')}
                                onChange={e => this.onUpdateField(e.target.value, 'title')}
                            />
                            )}
                        </Form.Item>

                        <Form.Item label={t('listElement:descLabel')}>
                            {getFieldDecorator('desc', {
                            validateTrigger: ['onBlur'],
                            rules: [
                                { required: true, message: t('listElement:descLabel') }
                            ]
                            })(
                            <Input.TextArea
                                rows={4}
                                placeholder={t('listElement:descPlaceholder')}
                                onChange={e => this.onUpdateField(e.target.value, 'desc')}
                            />
                            )}
                        </Form.Item>


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
                                    onChange={val =>
                                        this.onUpdateField(parseInt(val, 10), 'privacy')
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


                        <Form.Item label={t('contentCategory:categorylabel')}>
                            <div style={{ display: 'flex' }}>
                                {getFieldDecorator('category',
                                    this.isPublic(getFieldValue('privacy')) ?
                                 {
                                validateTrigger: ['onBlur'],
                                rules: [
                                    { required: true, message: t('contentCategory:categoryErrMsg') }
                                ]
                                } : {}
                                )(
                                <Select
                                    placeholder={t('contentCategory:categoryPlaceholder')}
                                    onChange={
                                        val => this.tagsApply(val)
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
                                {getFieldDecorator('sub_category', 
                                this.isPublic(getFieldValue('privacy')) ?
                                {
                                validateTrigger: ['onBlur'],
                                rules: [
                                    { required: true, message: t('subCategory:subCategoryErrMsg') }
                                ]
                                } : {}
                                )(
                                <Select
                                    mode="multiple"
                                    placeholder={t('subCategory:subCategoryPlaceholder')}
                                    onChange={val => {
                                        this.onUpdateField(parseInt(val, 10), 'sub_category')
                                    }}
                                    style={{ width: '200px' }}
                                >
                                    {selectedCategory != '' && selectedCategory !== undefined &&
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


                        <Form.Item label={t('tags')}>
                            {getFieldDecorator('tags', {
                            validateTrigger: ['onBlur'],
                            rules: [
                                {
                                required: true,
                                message: t('tagsRequiredErrMsg')
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


                        <Button
                            type="primary"
                            size="large"
                            className="save-button"
                            onClick={this.onClickSubmit}
                            disabled = {isButtonDisabled}
                        >
                          {t('save')}
                        </Button>&nbsp;&nbsp;

                        <Button
                        type="danger"
                        size="large"
                        className="cancel-button"
                        onClick={onListCancel}
                        >
                          {t('cancel')}
                        </Button>

                    </Form>


                </React.Fragment>

            </Drawer>
        )
    }

}

// export default ListElement;
export default compose(
    Form.create(),
    translate(['common', 'createNote', 'privacy', 'listElement'])
  )(ListElement)
  