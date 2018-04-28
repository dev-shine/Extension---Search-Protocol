import React, { Component } from 'react'
import { Modal, Select, Form, Input, Button } from 'antd'
import { notifyError, notifySuccess } from '../components/notification'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import API from '../common/api/cs_iframe_api'
import { compose, setIn, updateIn } from '../../common/utils'
import CreateLinkComp from '../components/create_link'
import './app.scss'

const ipc = ipcForIframe()

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
    API.postLinks(data)
    .then(() => {
      notifySuccess('Successfully posted')
      setTimeout(() => this.onClickCancel(), 1500)
    })
    .catch(e => {
      notifyError(e.message)
    })
  }

  onClickCancel = () => {
    API.setLinkPair({ links: [], desc: null, tags: null })
  }

  componentDidMount () {
    API.getLinkPairStatus()
    .then(linkPair => {
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

export default App
