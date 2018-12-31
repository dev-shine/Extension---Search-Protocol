import React, { Component } from 'react'
import { Drawer } from 'antd'
import { translate } from 'react-i18next'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import { setIn, updateIn, compose } from '../common/utils'
import API from 'cs_api'
import './app.scss'

const ipc = ipcForIframe()

const SOURCE = {
    "BRIDGE": "Bridges",
    "NOTES": "Notes",
    "NONE": "None"
}

class App extends Component {

    constructor(props) {
        super(props);
        this.state= {
            source: SOURCE.NONE,
            bridges: [],
            notes: [],
            via: SOURCE.NONE
        }
        
        ipc.ask('INIT_SIDEBAR')
        .then(data => {
            const bridgeObj = data.data;
            this.setState({
                bridges: bridgeObj.bridges,
                notes: bridgeObj.annotations
            })
        })

    }

    bridgeNoteData = (via) => {
        const {bridges, notes} = this.state;
        ipc.ask("BRIDGIT_SIDEBAR", {via, bridges, notes})
    }

    render () {
        const { t } = this.props
        const { source } = this.state

        return (
            <React.Fragment>
                <Drawer
                title="Bridgit"
                placement="left"
                width={100}
                closable={false}
                visible={true}
                >
                  <img src="./img/old_icon.png" className="bridge_style" height="64" width="64" onClick={() => this.bridgeNoteData(SOURCE.BRIDGE)} /><br/><br/>
                  <img src="./img/edit.png" className="bridge_style" height="64" width="64" onClick={() => this.bridgeNoteData(SOURCE.NOTES)} />

                </Drawer>
            </React.Fragment>
        )
    }
}

export default compose(
  translate(['common', 'bridgit_sidebar'])
)(App)
