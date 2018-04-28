import React from 'react'
import PropTypes from 'prop-types'
import { Alert, Button, Select, Form, Input } from 'antd'

const relationships = [
  'Supports', 'Refutes', 'Models', 'Aggregates',
  'is Example of', 'is Metaphor for', 'is Instance of', 'is Member of'
]

class CreateLinkComp extends React.Component {
  static propTypes = {
    linkPair:       PropTypes.object.isRequired,
    onUpdateField:  PropTypes.func.isRequired,
    onSubmit:       PropTypes.func.isRequired,
    onCancel:       PropTypes.func.isRequired
  }

  render () {
    if (!this.props.linkPair) return null

    const { getFieldDecorator } = this.props.form
    const pair = this.props.linkPair.data

    if (!pair.links || !pair.links.length)  return null

    return (
      <div className="to-create-link">
        <h2>Create Link</h2>
        <Form onSubmit={this.handleSubmit} className="create-link-form">
          <Form.Item label="How are these links related?">
            <div className="relationship-row">
              <div className="image-box">
                <img src={pair.links[0].image} />
              </div>

              <div>
                {getFieldDecorator('relationship', {
                  ...(pair.relationship ? { initialValue: pair.relationship } : {}),
                  rules: [
                    { required: true, message: 'Please select relation' }
                  ]
                })(
                  <Select
                    placeholder="Choose a relationship"
                    onChange={val => this.props.onUpdateField(val, 'relationship')}
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
            onClick={this.props.onSubmit}
          >
            POST IT!
          </Button>
          <Button
            type="danger"
            size="large"
            className="cancel-button"
            onClick={this.props.onCancel}
            onOldClick={() => {
              this.props.resetLinkPair()
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }
}

export default Form.create()(CreateLinkComp)
