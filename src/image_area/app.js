import React, { Component } from 'react'
import { Button } from 'antd'
import { notifyError, notifySuccess } from '../components/notification'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import API from '../common/api/cs_iframe_api'
import log from '../common/log'
import './app.scss'

const ipc = ipcForIframe()

class App extends Component {
  state = {
    linkData: null,
    image: {
      dataUrl: null,
      width: 0,
      height: 0
    }
  }

  onClickAnnotate = () => {
    log('annotate')
  }

  onClickCreateBridge = () => {
    log('create bridge')
  }

  onClickCancel = () => {
    ipc.ask('CLOSE')
  }

  componentDidMount () {
    ipc.ask('INIT')
    .then(({ linkData, dataUrl, width, height }) => {
      this.setState({
        linkData,
        image: {
          dataUrl,
          width,
          height
        }
      })
    })
  }

  render () {
    return (
      <div className="select-area-wrapper">
        <div
          className="image-wrapper"
          style={{
            width: this.state.image.width,
            height: this.state.image.height
          }}
        >
          <img src={this.state.image.dataUrl} />
        </div>
        <div className="actions">
          <Button
            type="primary"
            size="large"
            className="save-button"
            onClick={this.onClickAnnotate}
          >
            Annotate
          </Button>
          <Button
            type="primary"
            size="large"
            className="cancel-button"
            onClick={this.onClickCreateBridge}
          >
            Create Bridge
          </Button>
          <Button
            type="danger"
            size="large"
            className="cancel-button"
            onClick={this.onClickCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }
}

export default App
