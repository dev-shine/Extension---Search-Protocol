import React, { Component } from 'react'
import { Modal, Select, Form, Input, Button } from 'antd'
import { translate } from 'react-i18next'

import { notifyError, notifySuccess } from '../components/notification'
import ipc from '../common/ipc/ipc_dynamic'
import API from '../common/api/cs_api'
import log from '../common/log'
import * as C from '../common/constant'
import { compose, setIn, updateIn } from '../common/utils'
import CreateLinkComp from '../components/create_link'
import './app.scss'

class App extends Component {
  state = {
    mode:       null,
    linkPair:   null,
    bridgeData: null,
    relations:  [],
    selectedRelation: undefined
  }

  onClose = () => {
    ipc.ask('CLOSE')
  }

  onAddRelation = () => {
    ipc.ask('ADD_RELATION')
  }

  onUpdateField = (val, field) => {
    this.setState(
      compose(
        setIn(['bridgeData', field], val),
        field === 'relation' ? setIn(['selectedRelation'], val) : x => x
      )(this.state)
    )

    // if (this.state.mode === C.UPSERT_MODE.EDIT) {
    //   API.updateElementInLocalBridge({ [field]: val })
    // }
  }

  onSubmitAdd = (data) => {
    const { t } = this.props

    API.createBridge(data)
    .then(bridge => {
      ipc.ask('DONE', { bridge })
      notifySuccess(t('successfullyPosted'))
      setTimeout(() => {
        this.onClickCancel()
      }, 1500)
    })
    .catch(e => {
      notifyError(e.message)
    })
  }

  onSubmitEdit = (data) => {
    const { t } = this.props

    API.updateBridge(this.state.bridgeData.id, {
      id: this.state.bridgeData.id,
      ...data
    })
    .then(bridge => {
      ipc.ask('DONE', { bridge })
      notifySuccess(t('successfullyPosted'))
      setTimeout(() => {
        this.onClickCancel()
      }, 1500)
    })
    .catch(e => {
      notifyError(e.message)
    })
  }

  onClickSubmit = (data) => {
    switch (this.state.mode) {
      case C.UPSERT_MODE.ADD:
        return this.onSubmitAdd(data)

      case C.UPSERT_MODE.EDIT:
        return this.onSubmitEdit(data)
    }
  }

  onClickCancel = () => {
    API.resetLocalBridge()
    this.onClose()
  }

  componentDidMount () {
    ipc.ask('INIT')
    .then(({ bridgeData, linkPair, mode, relations }) => {
      log('buildBridge, INIT GOT', { bridgeData, linkPair, mode })

      this.setState({
        mode,
        bridgeData,
        relations,
        selectedRelation: bridgeData ? bridgeData.relation : undefined,
        ...(linkPair ? { linkPair } : {})
      })

      if (!linkPair) {
        API.getLocalBridgeStatus()
        .then(linkPair => {
          log('got linkPair', linkPair)
          this.setState({ linkPair })
        })
      }
    })

    ipc.onAsk((cmd, args) => {
      switch (cmd) {
        case 'SELECT_NEW_RELATION': {
          log('SELECT_NEW_RELATION', cmd, args)
          this.setState({
            relations: [...this.state.relations, args.relation],
            selectedRelation: args.relation.id
          })
          return true
        }
      }
    })
  }

  render () {
    if (!this.state.mode) return <div />

    return (
      <CreateLinkComp
        mode={this.state.mode}
        bridge={this.state.bridgeData}
        relations={this.state.relations}
        selectedRelation={this.state.selectedRelation}
        linkPair={this.state.linkPair}
        onUpdateField={this.onUpdateField}
        onAddRelation={this.onAddRelation}
        onSubmit={this.onClickSubmit}
        onCancel={this.onClickCancel}
      />
    )
  }
}

export default translate(['common', 'buildBridge'])(App)
