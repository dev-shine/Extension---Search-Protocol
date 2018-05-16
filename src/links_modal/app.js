import React, { Component } from 'react'
import { Modal, Select, Form, Input, Collapse } from 'antd'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import { flatten } from '../common/utils'
import API from '../common/api/cs_api'
import log from '../common/log'
import { TARGET_TYPE } from '../common/models/local_annotation_model'
import ClampPre from '../components/clamp_pre'
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
    .then(({ relations, bridges, annotations, elementId }) => {
      const elementIds = [
        ...flatten(bridges.map(b => [b.from, b.to])),
        ...annotations.map(a => a.target)
      ]

      this.setState({
        relations,
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
    const tags = annotation.tags.split(',').map(s => s.trim())

    return (
      <div className="annotation-item" key={key}>
        <h4>{annotation.title}</h4>
        <ClampPre>{annotation.desc}</ClampPre>
        <div className="tags">
          {tags.map((tag, i) => (
            <span key={i} className="tag-item">{tag}</span>
          ))}
        </div>
      </div>
    )
  }

  renderBridge (bridge, currentElementId, key) {
    const relation  = this.state.relations.find(r => '' + r.id === '' + bridge.relation)
    const relField  = bridge.from !== currentElementId ? 'active_name' : 'passive_name'
    const relStr    = relation ? (relation[relField].toUpperCase() + ' this piece') : 'unknown'

    const cpartId   = bridge.from !== currentElementId ? bridge.from : bridge.to
    const cpart     = this.state.elementDict[cpartId]
    const source    = new URL(cpart.url).origin.replace(/^.*?:\/\//, '')
    const typeImage = (function () {
      switch (cpart.type) {
        case TARGET_TYPE.IMAGE:
          return <img src="./svg/image.svg" />

        case TARGET_TYPE.SELECTION:
          return <img src="./svg/text.svg" />
      }
    })()
    const onClickLink = (e) => {
      if (cpart) {
        e.preventDefault()
        API.showElementInNewTab(cpart)
      }
    }

    return (
      <div className="bridge-item" key={key}>
        <a className="bridge-image" href={cpart.url} onClick={onClickLink}>
          <img src={cpart.image} />
        </a>
        <div className="bridge-detail">
          <table className="the-table">
            <tbody>
              <tr>
                <td>Relation</td>
                <td>{relStr}</td>
              </tr>
              <tr>
                <td>Source</td>
                <td>{source}</td>
              </tr>
              <tr>
                <td>Link</td>
                <td>
                  <a target="_blank" href={cpart.url} onClick={onClickLink}>
                    {cpart.url || '[URL deleted]'}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bridge-type">
          {typeImage}
        </div>
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
    const { bridges, annotations, elementId } = this.state

    return (
      <Collapse defaultActiveKey={['notes', 'bridges']}>
        <Collapse.Panel
          key="notes"
          header={`Notes (${annotations.length})`}
          disabled={annotations.length === 0}
        >
          {annotations.map((item, index) => (
            this.renderAnnotation(item, index)
          ))}
        </Collapse.Panel>
        <Collapse.Panel
          key="bridges"
          header={`Bridges (${bridges.length})`}
          disabled={bridges.length === 0}
        >
          {bridges.map((item, index) => (
            this.renderBridge(item, elementId, index)
          ))}
        </Collapse.Panel>
      </Collapse>
    )
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
        {this.renderB()}
      </Modal>
    )
  }
}

export default App
