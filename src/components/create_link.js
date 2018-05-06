import React from 'react'
import PropTypes from 'prop-types'
import { Alert, Button, Select, Form, Input } from 'antd'
import { TARGET_TYPE } from '../common/models/link_pair_model'
import './create_link.scss'

const relationships = [
  'Supports', 'Refutes', 'Models', 'Aggregates',
  'is Example of', 'is Metaphor for', 'is Instance of', 'is Member of'
]

class CreateLinkComp extends React.Component {
  static propTypes = {
    linkPair:       PropTypes.object,
    onUpdateField:  PropTypes.func.isRequired,
    onSubmit:       PropTypes.func.isRequired,
    onCancel:       PropTypes.func.isRequired
  }

  onSubmit = () => {
    this.props.form.validateFields((err, values) => {
      if (err)  return
      const pair = this.props.linkPair.data
      const data = {
        ...values,
        from: pair.links[0],
        to:   pair.links[1]
      }

      this.props.onSubmit(data)
    })
  }

  renderLinkPreview (link) {
    switch (link.type) {
      case TARGET_TYPE.IMAGE:
      case TARGET_TYPE.SCREENSHOT:
        return (
          <div className="image-box">
            <img src={link.image} />
          </div>
        )

      case TARGET_TYPE.SELECTION:
        return (
          <div className="text-box">
            {link.text}
          </div>
        )
    }
  }

  render () {
    if (!this.props.linkPair) return null

    const { getFieldDecorator } = this.props.form
    const pair = this.props.linkPair.data

    if (!pair.links || !pair.links.length)  return null

    return (
      <div className="to-create-link">
        <h2>Build Bridge</h2>
        <Form onSubmit={this.handleSubmit} className="create-link-form">
          <Form.Item label="How are these links related?">
            <div className="relationship-row">
              {this.renderLinkPreview(pair.links[0])}

              <div>
                {getFieldDecorator('relation', {
                  ...(pair.relation ? { initialValue: pair.relation } : {}),
                  rules: [
                    { required: true, message: 'Please select relation' }
                  ]
                })(
                  <Select
                    placeholder="Choose a relationship"
                    onChange={val => this.props.onUpdateField(val, 'relation')}
                  >
                    {relationships.map(r => (
                      <Select.Option key={r} value={r}>{r}</Select.Option>
                    ))}
                  </Select>
                )}
              </div>

              <div className="image-box">
                <img src={pair.links[1].image} />
              </div>
            </div>
          </Form.Item>

          <Form.Item label="What do you want to say about this link?">
            {getFieldDecorator('desc', {
              initialValue: pair.desc,
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: 'Please input description' }
              ]
            })(
              <Input.TextArea
                placeholder="Enter Description For This Link"
                onChange={e => this.props.onUpdateField(e.target.value, 'desc')}
              />
            )}
          </Form.Item>
          <Form.Item label="Tags">
            {getFieldDecorator('tags', {
              initialValue: pair.tags,
              validateTrigger: ['onBlur'],
              rules: [
                { required: true, message: 'Please input tags' }
              ]
            })(
              <Input
                placeholder="Supporting information, opposing information, data, another perspective, etc."
                onChange={e => this.props.onUpdateField(e.target.value, 'tags')}
              />
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
            POST IT!
          </Button>
          <Button
            type="danger"
            size="large"
            className="cancel-button"
            onClick={this.props.onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }
}

export default Form.create()(CreateLinkComp)
