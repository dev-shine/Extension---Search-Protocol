import React, { Component } from 'react'
import { Drawer } from 'antd'
import { translate } from 'react-i18next'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import { setIn, updateIn, compose } from '../common/utils'
import API from 'cs_api'
import './app.scss'

const ipc = ipcForIframe()

let SOURCE;

class App extends Component {

    constructor(props) {
        super(props);
        this.state= {
            source: "",
            bridges: [],
            notes: [],
            elements: []
        }
        
        ipc.ask('INIT_SIDEBAR')
        .then(data => {
            const bridgeObj = data.data;
            SOURCE = data.SOURCE;
            this.setState({
                bridges: bridgeObj.bridges,
                notes: bridgeObj.annotations,
                elements: bridgeObj.elements
            })
        })

    }

    bridgeNoteData = (via) => {
        const {bridges, notes, elements} = this.state;
        this.setState({
            source: via
        })
        ipc.ask("BRIDGIT_SIDEBAR", {via, bridges, notes, elements})
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
                <img
                    src={ SOURCE && source === SOURCE.BRIDGE ? "./img/bridge_active.png" : "./img/bridge_inactive.png"}
                    className="bridge_style"
                    height="64"
                    width="64"
                    onClick={() => this.bridgeNoteData(SOURCE.BRIDGE)}
                /><br/><br/>
                <img 
                    src={ SOURCE && source === SOURCE.NOTES ? "./img/notes_active.png" : "./img/notes_inactive.png"}
                    className="bridge_style"
                    height="64"
                    width="64"
                    onClick={() => this.bridgeNoteData(SOURCE.NOTES)}
                /><br/><br/>
                <img 
                    src={ SOURCE && source === SOURCE.BOARD ? "./img/board_active.png" : "./img/board_inactive.png"}
                    className="bridge_style"
                    height="64"
                    width="64"
                    onClick={() => this.bridgeNoteData(SOURCE.BOARD)}
                />
                <img 
                    src={ "./img/profile.png"}
                    className="bridge_style profile_section"
                    height="47"
                    width="45"
                />

                </Drawer>
            </React.Fragment>
        )
    }
}

export default compose(
  translate(['common', 'bridgit_sidebar'])
)(App)
