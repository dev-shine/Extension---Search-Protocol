import React, { Component } from 'react'
import { Drawer, Card } from 'antd'
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
        this.state = {
            source: SOURCE.NONE,
            notes: [],
            bridges: []
        }
        
        ipc.ask('INIT_SIDEBAR_DATA')
        .then(data => {
            const bridgeObj = data.data;
            this.setState({
                source: bridgeObj.via,
                bridges: bridgeObj.bridges || [],
                notes: bridgeObj.notes || []
            })
        })

    }

    scrollElement = (elem) => {
        const {source} = this.state
        ipc.ask("SCROLL_ELEMENT",{elem, source})
    }

    render () {
        const { t } = this.props
        const { source, bridges, notes } = this.state;
        console.log("notes :: ", notes);
        console.log("bridges :: ", bridges);

        return (

            <React.Fragment>
                <Drawer
                title= {source}
                placement="left"
                width={350}
                closable={true}
                visible={true}
                onClose = {() => ipc.ask("CLOSE_SIDEBAR_DATA")}
                >

                {source === SOURCE.BRIDGE && bridges.map(bridge => {
                    return (
                        <Card key={bridge.id} className="cursor" onClick={() => this.scrollElement(bridge)}>
                            <p>{bridge.desc}</p>
                        </Card>
                    )
                })}

                {source === SOURCE.NOTES && notes.map(note => {
                    return (
                        <Card key={note.id} className="cursor" onClick={() => this.scrollElement(note)}>
                            <h4>{note.title}</h4>
                            <p>{note.desc}</p>
                        </Card>
                    )
                })}


                </Drawer>
        </React.Fragment>

        )
    }
}

export default compose(
  translate(['common', 'bridgit_sidebar'])
)(App)
