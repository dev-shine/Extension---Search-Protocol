import React from 'react'
import PropTypes from 'prop-types'
import { Alert, Button, Select, Form, Input, Icon } from 'antd'
import { translate } from 'react-i18next'

import { ELEMENT_TYPE } from '../common/models/element_model'
import API from 'cs_api'
import './create_link.scss'
import log from '../common/log';
import * as C from '../common/constant'
import { compose, updateIn } from '../common/utils';
import { EDIT_BRIDGE_TARGET } from '../common/models/local_model';

class CreateLinkComp extends React.Component {
  static propTypes = {
    mode:           PropTypes.string.isRequired,
    bridge:         PropTypes.object,
    linkPair:       PropTypes.object,
    relations:      PropTypes.array.isRequired,
    selectedRelation: PropTypes.number,
    onUpdateField:  PropTypes.func.isRequired,
    onSubmit:       PropTypes.func.isRequired,
    onCancel:       PropTypes.func.isRequired,
    onAddRelation:  PropTypes.func
  }

  state = {
    exchangePosition: false
  }

  encodeData = (values) => {
    return compose(
      updateIn(['relation'], x => parseInt(x, 10)),
      updateIn(['privacy'], x => parseInt(x, 10))
    )(values)
  }

  decodeData = (values) => {
    return compose(
      updateIn(['relation'], x => x && ('' + x)),
      updateIn(['privacy'], x => x ? ('' + x) : '0')
    )(values)
  }

  onSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (err)  return

      const pair = this.props.linkPair.data
      const data = {
        ...this.encodeData(values),
        from: pair.links[this.state.exchangePosition ? 1 : 0],
        to:   pair.links[this.state.exchangePosition ? 0 : 1]
      }

      this.props.onSubmit(data)
    })
  }

  componentDidMount () {
    if (this.props.bridge) {
      setTimeout(() => {
        const values = this.decodeData({
          desc:       this.props.bridge.desc,
          tags:       this.props.bridge.tags,
          relation:   this.props.bridge.relation,
          privacy:    this.props.bridge.privacy
        })
        this.props.form.setFieldsValue(values)
      }, 60)
    }
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.bridge && nextProps.bridge !== this.props.bridge) {
      this.props.form.setFieldsValue(this.decodeData({
        desc:       nextProps.bridge.desc,
        tags:       nextProps.bridge.tags,
        relation:   nextProps.bridge.relation,
        privacy:    nextProps.bridge.privacy
      }))
    }

    if (nextProps.selectedRelation && nextProps.selectedRelation !== this.props.selectedRelation) {
      this.props.form.setFieldsValue(this.decodeData({
        relation: nextProps.selectedRelation
      }))
    }
  }

  renderLinkPreview (link, editBridgetTarget) {
    const { t, mode }   = this.props
    const renderDetail  = () => {
      switch (link.type) {
        case ELEMENT_TYPE.IMAGE:
        case ELEMENT_TYPE.SCREENSHOT:
          return (
            <div className="image-box">
              <img src={link.image} />
            </div>
          )

        case ELEMENT_TYPE.SELECTION:
          return (
            <div className="text-box">
              {link.text}
            </div>
          )
          // if (link.image && false) {
          //   return (
          //     <div className="image-box">
          //       <img src={link.image} />
          //     </div>
          //   )
          // } else {

          // }
      }
    }

    return (
      <div className="element-box">
        {renderDetail()}
        {mode === C.UPSERT_MODE.EDIT ? (
          <div className="element-actions">
            <Button
              type="default"
              onClick={() => {
                API.startEditBridge({
                  ...this.props.bridge,
                  from: this.props.bridge.fromElement,
                  to:   this.props.bridge.toElement
                }, editBridgetTarget)
                API.showElementInCurrentTab(link)
              }}
            >
              <img src="./img/edit.png" style={{ height: '14px' }} />
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  renderTitle () {
    const { t } = this.props

    switch (this.props.mode) {
      case C.UPSERT_MODE.ADD:
        return t('buildBridge')

      case C.UPSERT_MODE.EDIT:
        return t('buildBridge:editBridge')
    }
  }

  render () {
    if (!this.props.linkPair) return null

    const { t } = this.props
    const { getFieldDecorator } = this.props.form
    const pair = this.props.linkPair.data

    if (!pair.links || !pair.links.length)  return null

    return (
      <div className="to-create-link">
        <h2>{this.renderTitle()}</h2>
        <Form onSubmit={this.handleSubmit} className="create-link-form">
          <Form.Item label={t('buildBridge:relationLabel')} className="relation-form-item">
            <div className="relationship-row">
              {this.renderLinkPreview(
                pair.links[this.state.exchangePosition ? 1 : 0],
                this.state.exchangePosition ? EDIT_BRIDGE_TARGET.TO : EDIT_BRIDGE_TARGET.FROM
              )}

              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex' }}>
                  {getFieldDecorator('relation', {
                    ...(pair.relation ? { initialValue: '' + pair.relation } : {}),
                    rules: [
                      { required: true, message: t('buildBridge:relationErrMsg') }
                    ]
                  })(
                    <Select
                      placeholder={t('buildBridge:relationPlaceholder')}
                      onChange={val => this.props.onUpdateField(parseInt(val, 10), 'relation')}
                    >
                      {this.props.relations.map(r => (
                        <Select.Option key={r.id} value={'' + r.id}>{r.passive_name}</Select.Option>
                      ))}
                    </Select>
                  )}
                  {this.props.onAddRelation ? (
                    <Button
                      type="default"
                      shape="circle"
                      onClick={this.props.onAddRelation}
                      style={{ marginLeft: '10px' }}
                    >
                      <Icon type="plus" />
                    </Button>
                  ) : null}
                </div>
                <Button
                  style={{ marginTop: '20px' }}
                  onClick={() => {
                    this.setState({ exchangePosition: !this.state.exchangePosition })
                  }}
                >
                  <img src="./img/exchange.png" style={{ height: '14px' }} />
                </Button>
              </div>

              {this.renderLinkPreview(
                pair.links[this.state.exchangePosition ? 0 : 1],
                this.state.exchangePosition ? EDIT_BRIDGE_TARGET.FROM : EDIT_BRIDGE_TARGET.TO
              )}
            </div>
          </Form.Item>

          <Form.Item label={t('buildBridge:descLabel')} className="desc-form-item">
            {getFieldDecorator('desc', {
              initialValue: pair.desc,
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: t('buildBridge:descErrMsg') }
              ]
            })(
              <Input.TextArea
                placeholder={t('buildBridge:descPlaceholder')}
                onChange={e => this.props.onUpdateField(e.target.value, 'desc')}
              />
            )}
          </Form.Item>
          <Form.Item label={t('tags')}>
            {getFieldDecorator('tags', {
              initialValue: pair.tags,
              validateTrigger: ['onBlur'],
              rules: [
                {
                  required: true,
                  message: t('tagsRequiredErrMsg')
                },
                {
                  validator: (rule, value, callback) => {
                    const parts = (value || '').split(',')

                    if (parts.length > 5) {
                      const msg = t('tagsCountErrMsg')
                      return callback(msg)
                    }

                    callback()
                  }
                }
              ]
            })(
              <Input
                placeholder={t('tagsPlaceholderBridge')}
                onChange={e => this.props.onUpdateField(e.target.value, 'tags')}
              />
            )}
          </Form.Item>

          <Form.Item label={t('privacy:privacyLabel')}>
            {getFieldDecorator('privacy', {
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: t('privacy:privacyErrMsg') }
              ]
            })(
              <Select
                placeholder={t('privacy:privacyPlaceholder')}
                defaultValue="0"
                onChange={val => this.props.onUpdateField(parseInt(val, 10), 'privacy')}
                style={{ width: '150px' }}
              >
                {C.PRIVACY_LIST.map(p => (
                  <Select.Option key={p.value} value={'' + p.value}>{t(`privacy:${p.key}`)}</Select.Option>
                ))}
              </Select>
            )}
          </Form.Item>
        </Form>

        <div className="actions">
          <Button
            type="primary"
            size="large"
            className="post-button"
            onClick={this.onSubmit}
          >
            {t('buildBridge:postIt')}
          </Button>
          <Button
            type="danger"
            size="large"
            className="cancel-button"
            onClick={this.props.onCancel}
          >
            {t('cancel')}
          </Button>
        </div>
      </div>
    )
  }
}

export default compose(
  Form.create(),
  translate(['common', 'buildBridge', 'privacy'])
)(CreateLinkComp)
