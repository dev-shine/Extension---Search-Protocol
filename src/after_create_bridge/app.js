import React, { Component } from 'react'
import { Checkbox, Button } from 'antd'
import ipc from '../common/ipc/ipc_dynamic'
import API from '../common/api/cs_api'
import log from '../common/log'
import './app.scss'

class App extends Component {
  state = {
    hideAfterCreateMsg: false
  }

  render () {
    return (
      <div className="msg-wrapper">
        <p>
          Awesome! You've selected the content element that is one side of the bridge. Now you need to select the content element that will be the other side of the bridge.
        </p>

        <p>
          <b>Please do one of the following:</b>
          <br/>a) Select a new content element, right click, and select "Build Bridge"
          <br/>b) Move to the circular indicator associated with an existing content element and select "Build Bridge"
        </p>

        <p className="actions">
          <Checkbox
            onChange={(e) => {
              this.setState({ hideAfterCreateMsg: e.target.checked })

              API.updateUserSettings({ hideAfterCreateMsg: e.target.checked })
              .catch(e => {
                log.error(e.stack)
              })
            }}
            checked={this.state.hideAfterCreateMsg}
          >
            Do not show this message again
          </Checkbox>

          <Button type="primary" size="large" onClick={() => ipc.ask('CLOSE')}>
            Close
          </Button>
        </p>
      </div>
    )
  }
}

export default App
