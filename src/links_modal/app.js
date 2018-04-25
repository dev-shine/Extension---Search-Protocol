import React, { Component } from 'react'
import { Modal, Select, Form, Input } from 'antd'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import './app.scss'

const ipc = ipcForIframe()

class App extends Component {
  state = {
    pairs: [
      {
        desc: '111',
        id: '1',
        tags: 'one',
        relation: 'is Metaphor for',
        links: [
          { desc: 'A link', tags: 'cool A', url: 'http://a.com' },
          { desc: 'B link', tags: 'cool B', url: 'http://b.com' }
        ]
      },
      {
        desc: '222',
        id: '2',
        tags: 'two',
        relation: 'is Example of',
        links: [
          { desc: 'AA link', tags: 'cool AA', url: 'http://aa.com' },
          { desc: 'BA link', tags: 'cool BB', url: 'http://bb.com' }
        ]
      }
    ],
    pid: '2'
  }

  onClose = () => {
    ipc.ask('CLOSE')
  }

  componentDidMount () {
    ipc.ask('INIT')
    .then(pairs => {
      console.log('init got pairs', pairs)

      this.setState({
        pairs,
        pid: pairs.length > 0 ? pairs[0].id : null
      })
    })
  }

  render () {
    const pair = this.state.pairs.find(p => p.id === this.state.pid) || {}

    return (
      <Modal
        title="Bridgit Links"
        visible={true}
        style={{
          width: '100%',
          height: '100%'
        }}
        className="links-modal"
        footer={null}
        onCancel={this.onClose}
      >
        <Select
          className="pair-select"
          value={'' + this.state.pid}
          onChange={val => { this.setState({ pid: val }) }}
        >
          {this.state.pairs.map(p => (
            <Select.Option key={p.id} value={'' + p.id}>{p.desc}</Select.Option>
          ))}
        </Select>
        <table className="pair-details">
          <tbody>
            <tr>
              <td>Description</td>
              <td>{pair.desc}</td>
            </tr>
            <tr>
              <td>Relation</td>
              <td>{pair.relation}</td>
            </tr>
            <tr>
              <td>Tags</td>
              <td>{pair.tags}</td>
            </tr>
            <tr>
              <td>Link 1 Description</td>
              <td>{pair.links[0].desc}</td>
            </tr>
            <tr>
              <td>Link 2 Description</td>
              <td>{pair.links[1].desc}</td>
            </tr>
            <tr>
              <td>Link 1</td>
              <td>
                <a href={pair.links[0].url} target="_blank">
                  {pair.links[0].url}
                </a>
              </td>
            </tr>
            <tr>
              <td>Link 2</td>
              <td>
                <a href={pair.links[1].url} target="_blank">
                  {pair.links[1].url}
                </a>
              </td>
            </tr>
            <tr>
              <td>Link 1 Tags</td>
              <td>{pair.links[0].tags}</td>
            </tr>
            <tr>
              <td>Link 2 Tags</td>
              <td>{pair.links[1].tags}</td>
            </tr>
          </tbody>
        </table>
      </Modal>
    )
  }
}

export default App
