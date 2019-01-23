import React, { Component } from 'react'
import { Drawer, Badge } from 'antd'
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
            elements: [],
            lists: [],
            boardLen: 0,
            user: null,
            list: "" // incase of edit LIST it fill with list object
        }
        
        ipc.ask('INIT_SIDEBAR')
        .then(data => {
            const bridgeObj = data.data;
            SOURCE = data.SOURCE;
            this.setState({
                bridges: bridgeObj.bridges,
                notes: bridgeObj.annotations,
                elements: bridgeObj.elements,
                lists: bridgeObj.lists || [],
                list: data.list || '',
                user: data.user,
                boardLen: data.boardLen
            })
            this.bridgeNoteData(data.activeSource ? data.activeSource : SOURCE.BOARD);
        })

        ipc.onAsk((cmd, args) => {

            switch (cmd) {
      
                case 'RELOAD_SIDEBAR':
                {
                    const data = args;
                    const bridgeObj = data.data;
                    SOURCE = data.SOURCE;
                    this.setState({
                        bridges: bridgeObj.bridges,
                        notes: bridgeObj.annotations,
                        elements: bridgeObj.elements,
                        lists: bridgeObj.lists || [],
                        list: data.list || '',
                        user: data.user || null,
                        boardLen: data.boardLen
                    })
                    this.bridgeNoteData(data.activeSource ? data.activeSource : SOURCE.BOARD);
                    return true
                }
            }  
        })

    }

    bridgeNoteData = (via) => {
        const {bridges, notes, elements, lists, list, user} = this.state;
        this.setState({
            source: via,
            list: ''
        })
        ipc.ask("BRIDGIT_SIDEBAR", {via, bridges, notes, elements, lists, list, user})
    }

    render () {
        const { t } = this.props
        const { source, bridges, notes, elements, lists, boardLen } = this.state
        return (
            <React.Fragment>
                <Drawer
                title="Bridgit"
                placement="left"
                width={100}
                closable={false}
                visible={true}
                className="darwer_section"
                >

                <div className="badge_section">
                    <img
                        src={ SOURCE && source === SOURCE.BOARD ? "./img/board_active.png" : "./img/board_inactive.png"}
                        className="bridge_style"
                        height="64"
                        width="64"
                        onClick={() => this.bridgeNoteData(SOURCE.BOARD)}
                    />
                    {boardLen != 0 &&<Badge className="badge_icon_section" style={{ backgroundColor: '#ff6699' }}  count={boardLen} />}
                </div>

                <div className="badge_section">
                    <img
                        src={ SOURCE && source === SOURCE.LIST ? "./img/organize_active.png" : "./img/organize_inactive.png"}
                        className="bridge_style"
                        height="64"
                        width="64"
                        onClick={() => this.bridgeNoteData(SOURCE.LIST)}
                    />
                    {<Badge className="badge_icon_section" count={lists.length} style={{ backgroundColor: '#ff6699' }}/>}
                </div>

                <div className="badge_section">
                    <img
                        src={ SOURCE && source === SOURCE.BRIDGE ? "./img/bridge_active.png" : "./img/bridge_inactive.png"}
                        className="bridge_style"
                        height="64"
                        width="64"
                        onClick={() => this.bridgeNoteData(SOURCE.BRIDGE)}
                    />
                    <Badge className="badge_icon_section" count={bridges.length} style={{ backgroundColor: '#ff6699' }}/>
                </div>

                <div className="badge_section">
                    <img 
                        src={ SOURCE && source === SOURCE.NOTES ? "./img/notes_active.png" : "./img/notes_inactive.png"}
                        className="bridge_style"
                        height="64"
                        width="64"
                        onClick={() => this.bridgeNoteData(SOURCE.NOTES)}
                    />
                    <Badge className="badge_icon_section" count={notes.length} style={{ backgroundColor: '#ff6699' }}/>
                </div>

                <img 
                    src={ "./img/profile.png"}
                    className="bridge_style profile_section"
                    height="47"
                    width="45"
                    onClick = {() => ipc.ask("OPEN_PROFILE_PAGE")} 
                />

                </Drawer>
            </React.Fragment>
        )
    }
}

export default compose(
  translate(['common', 'bridgit_sidebar'])
)(App)
