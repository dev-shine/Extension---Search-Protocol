import React, { Component } from 'react'
import { Modal, Select, Form, Input, Collapse, Button, Popconfirm, Icon } from 'antd'
import { translate } from 'react-i18next'

import { ipcForIframe } from '../common/ipc/cs_postmessage'
import { flatten, setIn, updateIn } from '../common/utils'
import API from '../common/api/cs_api'
import log from '../common/log'
import { ELEMENT_TYPE } from '../common/models/element_model'
import ClampPre from '../components/clamp_pre'
import { notifyError, notifySuccess } from '../components/notification'
import './app.scss'

const ipc = ipcForIframe()

class App extends Component {
  state = {
    ready: false
  }

  onClose = () => {
    ipc.ask('CLOSE_RELATED_ELEMENTS')
  }

  init = () => {
    ipc.ask('INIT_RELATED_ELEMENTS')
    .then(({ relations, bridges, annotations, elementId, userInfo }) => {
      log('INIT WITH', { relations, bridges, annotations, elementId, userInfo })

      const elementIds = [
        ...flatten(bridges.map(b => [b.from, b.to])),
        ...annotations.map(a => a.target.id)
      ]

      this.setState({
        userInfo,
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

  bindIpcEvent = () => {
    ipc.onAsk((cmd, args) => {
      log('related elements onAsk', cmd, args)

      switch (cmd) {
        case 'UPDATE_ANNOTATION': {
          const { annotations } = this.state
          const index = annotations.findIndex(item => item.id === args.annotation.id)
          if (index === -1) return

          this.setState(
            setIn(['annotations', index], args.annotation, this.state)
          )
          return true
        }

        case 'UPDATE_BRIDGE': {
          const { bridges } = this.state
          const index = bridges.findIndex(item => item.id === args.bridge.id)
          if (index === -1) return

          this.setState(
            updateIn(['bridges', index], bridge => ({ ...bridge, ...args.bridge }), this.state)
          )
          return true
        }
      }
    })
  }

  componentDidMount () {
    this.init()
    this.bindIpcEvent()
  }

  renderAnnotation (annotation, key, isEditable) {
    const { t } = this.props
    const tags  = annotation.tags.split(',').map(s => s.trim())

    return (
      <div className="annotation-item base-item" key={key}>
        <div className="item-content">
          <h4>{annotation.title}</h4>
          <ClampPre>{annotation.desc}</ClampPre>
          <div className="tags">
            {tags.map((tag, i) => (
              <span key={i} className="tag-item">{tag}</span>
            ))}
          </div>
        </div>
        {isEditable ? (
          <div className="actions">
            <Button
              type="default"
              onClick={e => {
                ipc.ask('EDIT_ANNOTATION', { annotation })
              }}
            >
              <img src="./img/edit.png" style={{ height: '14px' }} />
            </Button>
            <Popconfirm
              onConfirm={() => {
                API.deleteNote(annotation.id)
                .then(() => {
                  notifySuccess(t('successfullyDeleted'))

                  // Note: tell page to reload bridges and notes
                  ipc.ask('RELOAD_BRIDGES_AND_NOTES')

                  // Note: update local data
                  this.setState({
                    annotations: this.state.annotations.filter(item => item.id !== annotation.id)
                  })
                })
                .catch(e => {
                  notifyError(e.message)
                })
              }}
              title={t('relatedElements:sureToDeleteNote')}
              okText={t('delete')}
              cancelText={t('cancel')}
            >
              <Button
                type="default"
              >
                <img src="./img/delete.png" style={{ height: '14px' }} />
              </Button>
            </Popconfirm>
          </div>
        ) : null}
      </div>
    )
  }

  renderBridge (bridge, currentElementId, key, isEditable) {
    const { t }     = this.props
    const relation  = this.state.relations.find(r => '' + r.id === '' + bridge.relation)
    const relField  = bridge.from !== currentElementId ? 'active_name' : 'passive_name'
    const relStr    = relation ? (relation[relField].toUpperCase()) : 'unknown'

    const cpartId   = bridge.from !== currentElementId ? bridge.from : bridge.to
    const cpart     = this.state.elementDict[cpartId]
    const source    = new URL(cpart.url).origin.replace(/^.*?:\/\//, '')
    const typeImage = (function () {
      switch (cpart.type) {
        case ELEMENT_TYPE.IMAGE:
          return <img src="./svg/image.svg" />

        case ELEMENT_TYPE.SELECTION:
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
      <div className="bridge-item base-item" key={key}>
        <div className="item-content">
          <a className="bridge-image" href={cpart.url} onClick={onClickLink}>
            <img src={cpart.image} />
          </a>
          <div className="bridge-detail">
            <table className="the-table">
              <tbody>
                <tr>
                  <td>{t('relation')}</td>
                  <td>{relStr}</td>
                </tr>
                <tr>
                  <td>{t('relatedElements:source')}</td>
                  <td>{source}</td>
                </tr>
                <tr>
                  <td>{t('link')}</td>
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
        {isEditable ? (
          <div className="actions">
            <Button
              type="default"
              onClick={e => {
                ipc.ask('EDIT_BRIDGE', {
                  bridge: {
                    ...bridge,
                    fromElement:  this.state.elementDict[bridge.from],
                    toElement:    this.state.elementDict[bridge.to]
                  }
                })
              }}
            >
              <img src="./img/edit.png" style={{ height: '14px' }} />
            </Button>
            <Popconfirm
              onConfirm={() => {
                API.deleteBridge(bridge.id)
                .then(() => {
                  notifySuccess(t('successfullyDeleted'))

                  // Note: tell page to reload bridges and notes
                  ipc.ask('RELOAD_BRIDGES_AND_NOTES')

                  // Note: update local data
                  this.setState({
                    bridges: this.state.bridges.filter(item => item.id !== bridge.id)
                  })
                })
                .catch(e => {
                  notifyError(e.message)
                })
              }}
              title={t('relatedElements:sureToDeleteBridge')}
              okText={t('delete')}
              cancelText={t('cancel')}
            >
              <Button
                type="default"
              >
                <img src="./img/delete.png" style={{ height: '14px' }} />
              </Button>
            </Popconfirm>
          </div>
        ) : null}
      </div>
    )
  }

  renderA () {
    const { bridges, annotations, elementId, userInfo } = this.state
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
    const { t } = this.props
    const { bridges, annotations, elementId, userInfo } = this.state
    const canEdit = (item, userInfo) => userInfo.admin || item.created_by === userInfo.id

    return (
      <Collapse defaultActiveKey={['notes', 'bridges']}>
        <Collapse.Panel
          key="notes"
          header={`${t('notes')} (${annotations.length})`}
          disabled={annotations.length === 0}
        >
          {annotations.map((item, index) => (
            this.renderAnnotation(item, index, canEdit(item, userInfo))
          ))}
        </Collapse.Panel>
        <Collapse.Panel
          key="bridges"
          header={`${t('bridges')} (${bridges.length})`}
          disabled={bridges.length === 0}
        >
          {bridges.map((item, index) => (
            this.renderBridge(item, elementId, index, canEdit(item, userInfo))
          ))}
        </Collapse.Panel>
      </Collapse>
    )
  }

  render () {
    const { t } = this.props

    if (!this.state.ready)  return <div>Loading...</div>

    return (
      <Modal
        title={t('relatedElements:relatedElements')}
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

export default translate(['common', 'relatedElements'])(App)
