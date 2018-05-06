import React, { Component } from 'react'
import { Modal, Select, Form, Input } from 'antd'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import { flatten } from '../common/utils'
import API from '../common/api/cs_api'
import log from '../common/log'
import './app.scss'

const ipc = ipcForIframe()

class App extends Component {
  state = {
    ready: false
  }

  onClose = () => {
    ipc.ask('CLOSE')
  }

  componentDidMount () {
    ipc.ask('INIT')
    .then(({ bridges, annotations, elementId }) => {
      const elementIds = [
        ...flatten(bridges.map(b => [b.from, b.to])),
        ...annotations.map(a => a.target)
      ]

      this.setState({
        bridges,
        annotations,
        elementId,
        ready: elementIds.length === 0
      })

      API.loadElementsByIds(elementIds)
      .then(elements => {
        const dict = elements.reduce((prev, el) => {
          prev[el.id] = el
          return prev
        }, {})

        this.setState({
          elementDict: dict,
          ready: true
        })
      })
      .catch(e => log.error(e.stack))
    })
  }

  renderAnnotation (annotation, index) {
    return (
      <div className="annotation-item" key={index}>
        <table className="the-table">
          <tbody>
            <tr>
              <td>Title</td>
              <td>{annotation.title}</td>
            </tr>
            <tr>
              <td>Body</td>
              <td>{annotation.desc}</td>
            </tr>
            <tr>
              <td>Tags</td>
              <td>{annotation.tags}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  renderBridge (bridge, currentElementId, index) {
    const renderParty = (party) => {
      if (party === currentElementId) {
        return 'this content'
      } else {
        const element = this.state.elementDict[party] || {}
        return <a href={element.url || 'https://www.google.com'} target="_blank">{element.url || '[URL deleted]'}</a>
      }
    }
    const from  = renderParty(bridge.from)
    const to    = renderParty(bridge.to)

    return (
      <div className="bridge-item" key={index}>
        <table className="the-table">
          <tbody>
            <tr>
              <td>Description</td>
              <td>{bridge.desc}</td>
            </tr>
            <tr>
              <td>Tags</td>
              <td>{bridge.tags}</td>
            </tr>
            <tr>
              <td>Relation</td>
              <td>{from} <span className="relation-verb">{bridge.relation}</span> {to}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  renderA () {
    const { bridges, annotations, elementId } = this.state
    console.log('state', this.state)

    return (
      <div className="two-columns">
        {!bridges.length ? null : (
          <div className="bridge-list">
            <h3>Bridges</h3>
            {bridges.map((bridge, i) => this.renderBridge(bridge, elementId, i))}
          </div>
        )}
        {!annotations.length ? null : (
          <div className="annotation-list">
            <h3>Annotations</h3>
            {annotations.map((annotation, i) => this.renderAnnotation(annotation, i))}
          </div>
        )}
      </div>
    )
  }

  renderB () {

  }

  render () {
    if (!this.state.ready)  return <div>Loading...</div>

    return (
      <Modal
        title="Bridgit Links"
        visible={true}
        width={700}
        className="links-modal"
        footer={null}
        onCancel={this.onClose}
      >
        {this.renderA()}
      </Modal>
    )
  }
}

export default App
