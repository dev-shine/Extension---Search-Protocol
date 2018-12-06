import React, { Component, Fragment } from 'react'
import { Modal, Select, Form, Input, Collapse, Button, Popconfirm, Icon, Tabs, Menu, Dropdown } from 'antd'
import { translate } from 'react-i18next'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import { flatten, setIn, updateIn, compose } from '../common/utils'
import API from 'cs_api'
import log from '../common/log'
import { ELEMENT_TYPE } from '../common/models/element_model'
import ClampPre from '../components/clamp_pre'
import { notifyError, notifySuccess } from '../components/notification'
import 'antd/dist/antd.less'
import './app.scss'
import throttle from 'lodash.throttle'

const domainFromUrl = (data) => {
  var a = document.createElement('a');
  a.href = data;
  return a.hostname;
}

const ipc = ipcForIframe()

API.addGAMessage = API.addGAMessage ? API.addGAMessage : () => {
  return Promise.resolve(true)
}

const convertToPlainString = (str) => str.trim().toLocaleLowerCase()
const TabPane = Tabs.TabPane
const MenuItem = Menu.Item
class App extends Component {
  state = {
    ready: false,
    searchText: '',
    followers: []
  }

  constructor (props) {
    super(props)
    this.likeContent = throttle(this.likeContent, 500)
  }
  onClose = () => {
    ipc.ask('CLOSE_RELATED_ELEMENTS')
  }

  init = () => {
    ipc.ask('INIT_RELATED_ELEMENTS')
    .then(({ relations, bridges, annotations, elementId, userInfo, noteCategories, element }) => {
      log('INIT WITH', { relations, bridges, annotations, elementId, userInfo, noteCategories, element })
      API.addGAMessage({
        eventCategory:'Clicked',
        eventAction:'RelatedElements',
        eventLabel:`for elementId=${elementId}`
      }).then(() => {
        log('ga message sent')
      })

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
        element,
        noteCategories,
        ready: elementIds.length === 0,
        tabActivekey: bridges.length > 0 ? '1' : '2' // 1 tab for bridges 2 for notes
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
            compose(
              // setIn(['annotations', index], args.annotation, this.state),
              updateIn(['annotations', index], annotation => ({ ...annotation, ...args.annotation })),
              setIn(['relations'], args.relations)
            )
          )
          return true
        }

        case 'UPDATE_BRIDGE': {
          const { bridges } = this.state
          const index = bridges.findIndex(item => item.id === args.bridge.id)
          if (index === -1) return

          this.setState(
            compose(
              updateIn(['bridges', index], bridge => ({ ...bridge, ...args.bridge })),
              setIn(['relations'], args.relations)
            )(this.state)
          )
          return true
        }
      }
    })
  }

  componentDidMount () {
    this.init()
    this.bindIpcEvent()

    API.getUserFollowers()
    .then(followers => {
      this.setState({
        followers
      })
    })
    .catch(err => {
      this.setState({
        followers: []
      })

      })

  }

  updateFollowUnFollowStatus = (createdBy) => {
    let { annotations, bridges } = this.state
    annotations = annotations.map((item) => {
      let obj = {...item}
      if (obj.created_by === createdBy) {
        obj.is_follow = !obj.is_follow
      }
      return obj
    });

    bridges = bridges.map((item) => {
      let obj = {...item}
      if (obj.created_by === createdBy) {
        obj.is_follow = !obj.is_follow
      }
      return obj
    });

    this.setState({
      annotations,
      bridges
    })
  }

  openFlagContent = content => {
    ipc.ask('FLAG_CONTENT', { content })
  }

  // type =>  0= Bridge; 1= notes; 2 = content elements 
  openShareContent = (shareContent, type, followers) => {
    ipc.ask('SHARE_CONTENT', { shareContent, type, followers })
  }
  likeContent (obj) {
    const { type, type_id:id, is_like: isLike } = obj
    let { bridges, annotations } = this.state
    const dataObj = {...obj, emoji_type: 'like'}
    if (type === 0) { // update in bridge
      console.log('liking bridge')
      bridges = bridges.map(b => {
        if (b.id === id) {
          return {
            ...b,
            like_count: b.like_count + (isLike ? -1 : 1),
            is_like: !isLike
          }
        }
        return b
      })
      this.setState({
        bridges
      })
    } else if (type === 1) { // update in note
      console.log('liking note')
      annotations = annotations.map(a => {
        if (a.id === id) {
          return {
            ...a,
            like_count: a.like_count + (isLike ? -1 : 1),
            is_like: !isLike
          }
        }
        return a
      })
      this.setState({
        annotations
      })
    }
     API.likeAction(dataObj)
    .then(() => {
      ipc.ask('RELOAD_BRIDGES_AND_NOTES')
    })
    .catch(e => {
       notifyError(e.message)
    })
  }
  renderAnnotation (annotation, key, isEditable) {
    const { t } = this.props
    const { userInfo, followers } = this.state
    const isLoggedIn = !(userInfo === null)
    const tags  = annotation.tags.split(',').map(s => s.trim())
    const relation  = this.state.noteCategories.find(r => '' + r.id === '' + annotation.relation)
    const relStr    = this.renderRelationStr(relation, 'name')
    const menu = (
      <Menu>
        {isEditable &&
            <MenuItem key="1" >
              <a onClick={e => {
                ipc.ask('EDIT_ANNOTATION', { annotation })
              }}>
                Edit
              </a>
            </MenuItem>
        }
        {isEditable &&
            <MenuItem key="2" >
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
                <a>
                  Delete
                </a>
                </Popconfirm>
            </MenuItem>
        }
        <MenuItem key="3">
          <a onClick={e => { this.openFlagContent({type_id: annotation.id, type: 1}) }}>Flag</a>
        </MenuItem>
      </Menu>
    );
    return (
      <div className="annotation-item base-item" key={key}>
        <div className="item-content">
          <h4 style={{marginBottom: '2px'}}>
            <span>{annotation.title}</span>
          </h4>
          <h4>
            <span className="annotation-relation">
              {relStr}
            </span>
            <span className="creator-info">
              <span>{annotation.created_by_username}</span>
              {this.state.userInfo && this.state.userInfo.id !== annotation.created_by ? (
                <Button
                  type="default"
                  size="small"
                  onClick={() => {
                    API.userFollow({ user_id: annotation.created_by })
                    .then(() => {
                      notifySuccess(`${annotation.is_follow ? t('Successfully Unfollowed') : t('Successfully Followed')}`)

                      // Note: tell page to reload bridges and notes
                      ipc.ask('RELOAD_BRIDGES_AND_NOTES')
                      // locally update status
                      this.updateFollowUnFollowStatus(annotation.created_by)
                    })
                  }}
                >
                  {annotation.is_follow ? t('unfollow') : t('follow')}
                </Button>
              ) : null}
            </span>
          </h4>
          <ClampPre
            onShowMore = {() => {
              API.addGAMessage({
                eventCategory:'Clicked',
                eventAction:'ShowMoreNotes',
                eventLabel:`for elementId=${annotation.id}`
              }).then(() => {
                log('ga message sent')
              })
            }}
            extraActions={(
              <div className="extra">
                {annotation.privacy !== 0 ? (
                  <img src="./img/lock.png" className="lock-icon" />
                ) : null}
                {tags.map((tag, i) => (
                  <span key={i} className="tag-item">{tag}</span>
                ))}
              </div>
            )}
          >
            {annotation.desc}
          </ClampPre>
        </div>
        <div className="actions">
          <Dropdown
            overlay={menu}
            // trigger={['click']}
            placement="bottomRight"
          >
            <Icon type="ellipsis" style={{fontSize:'20px'}} />
          </Dropdown>
          { /* isEditable ? (
            <Button
              type="default"
              onClick={e => {
                ipc.ask('EDIT_ANNOTATION', { annotation })
              }}
            >
              <img src="./img/edit.png" style={{ height: '14px' }} />
            </Button>
          ) : null */ }
          { /* isEditable ? (
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
          ) : null */}
          {isLoggedIn &&
          <Button
            type="default"
            onClick={() => { this.openShareContent({...annotation}, 1, followers) }}
          >
            <img src="./img/share.png" style={{ height: '14px' }} />
          </Button>}
          {isLoggedIn ? (<Button
            type="default"
            size="large"
            onClick={() => {
              this.likeContent({type_id:annotation.id, type: 1, is_like: annotation.is_like})
            }}
          >
            <img src={annotation.is_like ? './img/liked_heart.png' : './img/like_heart.png'} style={{ height: '14px' }} />
            <div style={{ fontSize: '10px' }}> {annotation.like_count} </div>
          </Button>
          ) : null
        }
        </div>
      </div>
    )
  }

  renderRelationStr = (relation, relField) => {
    const { t } = this.props

    if (!relation)  return 'unknown'

    switch (relation.type) {
      case 1:
        return relation[relField].toUpperCase()

      case 0:
        return relation[relField].toUpperCase() + ` (${t('userDefined')})`
    }
  }

  renderBridge (bridge, currentElementId, key, isEditable) {
    const { t }     = this.props
    const { userInfo, followers } = this.state
    const isLoggedIn = !(userInfo === null)
    const relation  = this.state.relations.find(r => '' + r.id === '' + bridge.relation)
    const relField  = bridge.from !== currentElementId ? 'active_name' : 'passive_name'
    const relStr    = this.renderRelationStr(relation, relField)

    const tags      = bridge.tags.split(',').map(s => s.trim())
    const cpartId   = bridge.from !== currentElementId ? bridge.from : bridge.to
    const cpart     = this.state.elementDict[cpartId]
    const source    = new URL(cpart.url).origin.replace(/^.*?:\/\//, '')
    let bridgeToDomain = source // domainFromUrl(bridge.toElement.url)
    // let splitArr = bridgeToDomain.split('.')
    // bridgeToDomain = splitArr.slice(0, splitArr.length - 1).join('')
    const typeImage = (function () {
      switch (cpart.type) {
        case ELEMENT_TYPE.IMAGE:
          return <img src="./svg/image.svg" />

        case ELEMENT_TYPE.SELECTION:
          return <img src="./svg/text.svg" />
      }
    })()
    const onClickLink = (e) => {
      API.addGAMessage({
        eventCategory:'Clicked',
        eventAction:'Bridge',
        eventLabel:`for elementId=${bridge.id}`
      }).then(() => {
        log('ga message sent')
      })
      if (cpart) {
        if (API.showElementInCurrentTab(cpart, bridge) !== true) {
          e.preventDefault()
        }
      }
    }

    const menu = (
      <Menu>
        {isEditable &&
            <MenuItem key="1" >
              <a onClick={e => {
                ipc.ask('EDIT_BRIDGE', {
                  bridge: {
                    ...bridge,
                    fromElement:  this.state.elementDict[bridge.from],
                    toElement:    this.state.elementDict[bridge.to]
                  }
                })
              }}>
                Edit
              </a>
            </MenuItem>
        }
        {isEditable &&
            <MenuItem key="2" >
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
                title={t('relatedElements:sureToDeleteNote')}
                okText={t('delete')}
                cancelText={t('cancel')}
              >
                <a>
                  Delete
                </a>
                </Popconfirm>
            </MenuItem>
        }
        <MenuItem key="3">
          <a onClick={e => { this.openFlagContent({type_id: bridge.id, type: 0}) }}>Flag</a>
        </MenuItem>
      </Menu>
    );
    return (
      <div className="bridge-item base-item" key={key}>
        <div className="item-content">
          <a className="bridge-image" target="_top" href={cpart.url} onClick={onClickLink}>
            {
              cpart.type === ELEMENT_TYPE.SELECTION
              ? <div className='selection-text'>
                {cpart.text}
              </div>
              : <img src={cpart.image} />
            }
          </a>
          <div className="bridge-detail">
            <div className="domain-name-link">
              <a href={cpart.url} target='_top' onClick={onClickLink}>{bridgeToDomain.toUpperCase()} </a>
            </div>
            <div className="bridge-title">
              <div className="bridge-relation">
                {relStr}
              </div>
              <span className="creator-info">
                <span>{bridge.created_by_username}</span>
                {this.state.userInfo && this.state.userInfo.id !== bridge.created_by ? (
                  <Button
                    type="default"
                    size="small"
                    onClick={() => {
                      API.userFollow({ user_id: bridge.created_by })
                      .then(() => {
                        notifySuccess(`${bridge.is_follow ? t('Successfully Unfollowed') : t('Successfully Followed')}`)
                        // Note: tell page to reload bridges and notes
                        ipc.ask('RELOAD_BRIDGES_AND_NOTES')
                        // locally update status
                        this.updateFollowUnFollowStatus(bridge.created_by)
                      })
                    }}
                  >
                    {bridge.is_follow ? t('unfollow') : t('follow')}
                  </Button>
                ) : null}
              </span>
            </div>
            <ClampPre
              onShowMore = {() => {
                API.addGAMessage({
                  eventCategory:'Clicked',
                  eventAction:'ShowMoreBridges',
                  eventLabel:`for elementId=${bridge.id}`
                }).then(() => {
                  log('ga message sent')
                })
              }}
              extraActions={(
                <div className="extra">
                  {bridge.privacy !== 0 ? (
                    <img src="./img/lock.png" className="lock-icon" />
                  ) : null}
                  {tags.map((tag, i) => (
                    <span key={i} className="tag-item">{tag}</span>
                  ))}
                </div>
              )}
            >
              {bridge.desc}
            </ClampPre>
          </div>
          {/* <div className="bridge-type">
            {typeImage}
          </div> */}
        </div>
        <div className="actions">
          {/* <Button
            type="default"
            onClick={onClickLink}
          >
            <img src="./img/link.png" style={{ height: '14px' }} />
          </Button>
          <Button
            type="default"
            onClick={() => {}}
          >
            <img src="./img/share.png" style={{ height: '14px' }} />
          </Button> */}
          <Dropdown
            overlay={menu}
            // trigger={['click']}
            placement="bottomRight"
          >
            <Icon type="ellipsis" style={{fontSize:'20px'}} />
          </Dropdown>
          {/* isEditable ? (
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
          ) : null */ }
          {/* isEditable ? (
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
          ) : null */}
          {isLoggedIn &&
          <Button
            type="default"
            onClick={() => { this.openShareContent({...bridge}, 0, followers) }}
          >
            <img src="./img/share.png" style={{ height: '14px' }} />
          </Button>}

          {isLoggedIn ? (<Button
            size="large"
            type="default"
            onClick={() => {
              this.likeContent({type_id:bridge.id, type: 0, is_like: bridge.is_like})
            }}
          >
            <img src={bridge.is_like ? './img/liked_heart.png' : './img/like_heart.png'} style={{ height: '14px' }} />
            <div style={{ fontSize: '10px' }}> {bridge.like_count} </div>
          </Button>
          ) : null}
        </div>
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
    const { annotations, elementId, userInfo } = this.state
    const sortBridges  = (list) => {
      list.sort((a, b) => {
        const relationA = this.state.relations.find(r => '' + r.id === '' + a.relation)
        const relationB = this.state.relations.find(r => '' + r.id === '' + b.relation)

        // Standard relations come first before user defined relations
        if (relationA !== relationB)  return relationB.type - relationA.type

        // If relation type equals, Sort by id
        return b.id - a.id
      })
      return list
    }
    const bridges   = sortBridges(this.state.bridges)
    const canEdit   = (item, userInfo) => userInfo && (userInfo.admin || item.created_by === userInfo.id)

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

  renderT () {
    const { t } = this.props
    const { annotations, elementId, userInfo, tabActivekey } = this.state
    const sortBridges  = (list) => {
      list.sort((a, b) => {
        const relationA = this.state.relations.find(r => '' + r.id === '' + a.relation)
        const relationB = this.state.relations.find(r => '' + r.id === '' + b.relation)

        // Standard relations come first before user defined relations
        if (relationA !== relationB)  return relationB.type - relationA.type

        // If relation type equals, Sort by id
        return b.id - a.id
      })
      return list
    }
    const bridges   = sortBridges(this.state.bridges)
    const canEdit   = (item, userInfo) => userInfo && (userInfo.admin || item.created_by === userInfo.id)
    const filteredNotes = this.searchFilterNotes(annotations)
    const filteredBridges = this.searchFilterBridges(bridges)
    return (
      <Tabs
        defaultActiveKey={bridges.length > 0 ? '1' : '2'}
        onChange={(key) => {
          log(key)
          this.setState({
            tabActivekey: key
          })
        }}
        type="card"
      >
        <TabPane
          tab={ <span className={tabActivekey === '1' ? 'active-tab' : ''}> {'Bridges (' + filteredBridges.length + ')'} </span>}
          key="1"
          disabled={ bridges.length < 1 }
        >
          <div className='tab-pane'>
            {filteredBridges.map((item, index) => (
                this.renderBridge(item, elementId, index, canEdit(item, userInfo))
              ))
            }
          </div>
        </TabPane>
        <TabPane
          tab={ <span className={tabActivekey === '2' ? 'active-tab' : ''}>{'Notes (' + filteredNotes.length + ')'} </span>}
          key="2"
          disabled={ annotations.length < 1 }
        >
          <div className='tab-pane'>
            {filteredNotes.map((item, index) => (
                this.renderAnnotation(item, index, canEdit(item, userInfo))
              ))
            }
          </div>
        </TabPane>
      </Tabs>
    )
  }

  searchFilterBridges = (bridges) => {
    const { relations, searchText, tabActivekey, elementId: currentElementId } = this.state
    if (searchText === '' /* ||  tabActivekey !== '1' */) {
      return bridges
    }
    const fieldsToFilter = ['desc', 'relationName', 'tags']
    return bridges.filter(bridge => {
      const relation  = relations.find(r => '' + r.id === '' + bridge.relation)
      const relField  = bridge.from !== currentElementId ? 'active_name' : 'passive_name'
      const relationName = relation[relField]
      bridge = {...bridge, relationName}
      return fieldsToFilter.some(field => {
         return convertToPlainString(bridge[field]).indexOf(convertToPlainString(searchText)) > -1
      })
    })
  }

  searchFilterNotes = (notes) => {
    const { noteCategories, searchText, tabActivekey } = this.state
    if (searchText === '' /* || tabActivekey !== '2' */) {
      return notes
    }
    const fieldsToFilter = ['desc', 'relationName', 'tags', 'title']
    return notes.filter(note => {
      const relation = noteCategories.find(r => '' + r.id === '' + note.relation)
      const relationName = relation['name']
      note = {...note, relationName}
      return fieldsToFilter.some(field => {
        return convertToPlainString(note[field]).indexOf(convertToPlainString(searchText)) > -1
      })
    })
  }

  getElementName = () => {
    const { element } = this.state
    if (element.name) {
      return element.name;
    }
    if (ELEMENT_TYPE.SELECTION === element.type) {
      return element.text.split(/\s+/).slice(0, 5).join(' ');
    } else {
      return 'An Image';
    }
  }

  upadteElementFollowStatus = () => {
    const { element } = this.state
    this.setState({
      element: {
        ...element,
        is_follow: !element.is_follow
      }
    })
  }

  renderElementFollow = () => {
     const { element } = this.state
     const { t } = this.props
    return (
    <Button
      type="default"
      size="small"
      onClick={() => {
        API.elementFollow({element_id: element.id})
        .then(() => {
          let successMessage = element.is_follow ? t('Successfully Unfollowed') : t('Successfully Followed')
          this.upadteElementFollowStatus()
          ipc.ask('RELOAD_BRIDGES_AND_NOTES')
          notifySuccess(successMessage)
        })
      }}
    >
      {element.is_follow ? t('unfollow') : t('follow')}
    </Button>
    )
  }

  renderModalHeader = () => {
    const { t } = this.props
    const { element } = this.state
    return (
      <div className='modal-title'>
        <div className='app-logo'>
          <img src="./img/logo.png" />
        </div>
        <div className='element-name'>
         {this.getElementName()}
         {this.renderElementFollow()}
        </div>
        <div className='search-input'>
          <Input
            placeholder={t('search')}
            onChange={e => this.setState({
              searchText: e.target.value
            })}
          />
        </div>
        {/* <div>
          <a
           style={{color:'#000'}}
            onClick={this.onClose}
          >
            <Icon
              style={{
                fontSize: '15px'
              }}
              type="close"
            />
          </a>
        </div> */}
      </div>
    )
    // return (
    //   <h1> {t('relatedElements:relatedElements')} </h1>
    // );
  }

  deleteLink = () => {

    const { t } = this.props;
    API.deleteElement(this.state.elementId)
    .then(() => {
      notifySuccess(t('successfullyDeleted'))
      // Note: tell page to reload elements
      ipc.ask('RELOAD_BRIDGES_AND_NOTES')
      setTimeout(() => {
        this.onClose();
      }, 2000);
    })
    .catch(e => {
      console.log("In Error :: ", e);
      notifyError(e.message)
    })    
  }

  render () {
    const { t } = this.props
    const {element, bridges, annotations, userInfo} = this.state;
    
    if (!this.state.ready)  {
      return (
        <div>
          {/* <div style={{display:'flex', justifyContent:'flex-end', marginRight:'30px', marginTop: '80px'}}>
            <a
              style={{color:'#000'}}
              onClick={this.onClose}
            >
              <Icon
                style={{
                  fontSize: '15px'
                }}
                type="close"
              />
            </a>
          </div> */}
          <div className='loading-container1'>Loading...</div>
        </div>
    );
    }
    // return (
    //   <div className='links-modal'>
    //     {this.renderModalHeader()}
    //     {this.renderT()}
    //   </div>
    // )
    return (
      <Modal
        title={this.renderModalHeader()}
        maskStyle={{
          backgroundColor: 'rgba(55, 55, 55, 0.3)'
        }}
        visible={true}
        width={700}
        className="links-modal"
        // footer={null}
        footer={(userInfo && userInfo.admin == 1 && element && annotations.length === 0 && bridges.length === 0 && element.is_follow === false ) ? [
          <Button key="Delete" type="primary"  onClick={this.deleteLink}>
            Delete
          </Button>
        ]: null}
        onCancel={this.onClose}
      >
        {this.renderT()}
      </Modal>
    )
  }
}

export default translate(['common', 'relatedElements'])(App)
