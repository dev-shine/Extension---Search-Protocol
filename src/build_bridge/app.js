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
    bridgeData: null
  }

  onClose = () => {
    ipc.ask('CLOSE')
  }

  onUpdateField = (val, field) => {
    this.setState(
      setIn(['linkPair', 'data', field], val, this.state)
    )
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
    API.setLinkPair({ links: [], desc: null, tags: null })
    this.onClose()
  }

  componentDidMount () {
    API.getLocalBridgeStatus()
    .then(linkPair => {
      log('got linkPair', linkPair)
      this.setState({ linkPair })
    })

    ipc.ask('INIT')
    .then(({ bridgeData, mode }) => {
      log('buildBridge, INIT GOT', { bridgeData, mode })
      this.setState({ mode, bridgeData })
    })
  }

  render () {
    if (!this.state.mode) return <div />

    return (
      <CreateLinkComp
        mode={this.state.mode}
        bridge={this.state.bridgeData}
        linkPair={this.state.linkPair}
        onUpdateField={this.onUpdateField}
        onSubmit={this.onClickSubmit}
        onCancel={this.onClickCancel}
      />
    )
  }
}

export default translate(['common', 'buildBridge'])(App)
