import React, { Component } from 'react'
import { Modal, Select, Form, Input, Button } from 'antd'
import { notifyError, notifySuccess } from '../components/notification'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import API from '../common/api/cs_iframe_api'
import './app.scss'

const ipc = ipcForIframe()

class App extends Component {
  state = {
  }

  onClose = () => {
    ipc.ask('CLOSE')
  }

  componentDidMount () {
    API.getLinkPairStatus()
    .then(({ status, data }) => {
      this.setState({
        links:  data.links || [],
        desc:   data.desc || '',
        tags:   data.tags || '',
        relationship: data.relationship || ''
      })
    })
    // ipc.ask('INIT')
    // .then(pairs => {
    //   console.log('init got pairs', pairs)

    //   this.setState({
    //     pairs,
    //     pid: pairs.length > 0 ? pairs[0].id : null
    //   })
    // })
  }

  render () {
    const pair = this.state.pairs.find(p => p.id === this.state.pid) || {}

    return (
    )
  }
}

export default App
