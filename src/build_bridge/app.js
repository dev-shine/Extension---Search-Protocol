import React, { Component } from 'react'
import { Modal, Select, Form, Input, Button } from 'antd'
import { translate } from 'react-i18next'

import { notifyError, notifySuccess } from '../components/notification'
import ipc from '../common/ipc/ipc_dynamic'
import API from '../common/api/cs_api'
import { compose, setIn, updateIn } from '../common/utils'
import CreateLinkComp from '../components/create_link'
import './app.scss'

class App extends Component {
  state = {
    linkPair: null
  }

  onClose = () => {
    ipc.ask('CLOSE')
  }

  onUpdateField = (val, field) => {
    this.setState(
      setIn(['linkPair', 'data', field], val, this.state)
    )
  }

  onClickSubmit = (data) => {
    const { t } = this.props

    API.createBridge(data)
    .then(() => {
      ipc.ask('DONE')
      notifySuccess(t('successfullyPosted'))
      setTimeout(() => {
        this.onClickCancel()
      }, 1500)
    })
    .catch(e => {
      notifyError(e.message)
    })
  }

  onClickCancel = () => {
    API.setLinkPair({ links: [], desc: null, tags: null })
    this.onClose()
  }

  componentDidMount () {
    API.getLinkPairStatus()
    .then(linkPair => {
      console.log('got linkPair', linkPair)
      this.setState({ linkPair })
    })
  }

  render () {
    return (
      <CreateLinkComp
        linkPair={this.state.linkPair}
        onUpdateField={this.onUpdateField}
        onSubmit={this.onClickSubmit}
        onCancel={this.onClickCancel}
      />
    )
  }
}

export default translate(['common', 'buildBridge'])(App)
