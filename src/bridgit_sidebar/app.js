import React, { Component } from 'react'
import { Drawer } from 'antd'
import { translate } from 'react-i18next'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import { setIn, updateIn, compose } from '../common/utils'
import API from 'cs_api'
import './app.scss'

const ipc = ipcForIframe()

class App extends Component {

    constructor(props) {
        super(props);
    }



render () {
    const { t } = this.props

    return (
        <React.Fragment>
            <Drawer
            title="Bridgit"
            placement={'left'}
            closable={true}
            // onClose={this.onClose}
            visible={true}
            >
            </Drawer>
        </React.Fragment>
    )
  }
}

export default compose(
  translate(['common', 'bridgit_sidebar'])
)(App)
