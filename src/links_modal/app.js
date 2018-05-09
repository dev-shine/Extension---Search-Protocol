import React, { Component } from 'react'
import { Modal, Select, Form, Input } from 'antd'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import { flatten } from '../common/utils'
import API from '../common/api/cs_api'
import log from '../common/log'
import { TARGET_TYPE } from '../common/models/local_annotation_model'
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

  renderAnnotation (annotation, key) {
    return (
      <div className="annotation-item" key={key}>
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

  renderBridge (bridge, currentElementId, key) {
    const renderParty = (party) => {
      if (party === currentElementId) {
        return 'this content'
      } else {
        const element = this.state.elementDict[party] || {}
        return <a href={element.url || 'https://www.google.com'} target="_blank">{element.url || '[URL deleted]'}</a>
      }
    }
    const from    = renderParty(bridge.from)
    const to      = renderParty(bridge.to)
    const cpartId = bridge.from !== currentElementId ? bridge.from : bridge.to
    const cpart   = this.state.elementDict[cpartId]
    const source  = new URL(cpart.url).origin
    const cpartContent = (function () {
      switch (cpart.type) {
        case TARGET_TYPE.IMAGE:
          return <img src={cpart.image} style={{ maxHeight: '100px', border: '1px solid #eee' }} />

        case TARGET_TYPE.SELECTION:
          return <p>{cpart.text}</p>

        default:
          return 'unknown source type, '  + cpart.type
      }
    })()

    return (
      <div className="bridge-item" key={key}>
        <table className="the-table">
          <tbody>
            <tr>
              <td>Connected with</td>
              <td>{cpartContent}</td>
            </tr>
            <tr>
              <td>Relation</td>
              <td>{from} <span className="relation-verb">{bridge.relation}</span> {to}</td>
            </tr>
            <tr>
              <td>Source</td>
              <td>
                <a href={source} target="_blank">{source}</a>
              </td>
            </tr>
            <tr>
              <td>Description</td>
              <td>{bridge.desc}</td>
            </tr>
            <tr>
              <td>Tags</td>
              <td>{bridge.tags}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  renderA () {
    const { bridges, annotations, elementId } = this.state
    const sortList = (list) => {
      const getCreated = (item) => (item && item.created) ? parseInt(item.created, 10) : 0
      const compare = (a, b) => {
        return getCreated(a) - getCreated(b)
      }
      const result = list.slice()
      result.sort(compare)
      return result
    }
    const allList = sortList([
      ...bridges.map(data => ({ type: 'bridge', data })),
      ...annotations.map(data => ({ type: 'annotation', data }))
    ])
    const renderItem = (item, index) => {
      switch (item.type) {
        case 'bridge':
          return this.renderBridge(item.data, elementId, index)

        case 'annotation':
          return this.renderAnnotation(item.data, index)

        default:
          throw new Error(`not supported type ${item.type}`)
      }
    }

    return (
      <div className="one-column">
        {allList.map(item => (
          renderItem(item)
        ))}
      </div>
    )
  }

  renderB () {

  }

  render () {
    if (!this.state.ready)  return <div>Loading...</div>

    return (
      <Modal
        title="Related Elements"
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
