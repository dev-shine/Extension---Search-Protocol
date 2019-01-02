import React, { Component } from 'react'
import { Drawer, Card, Icon } from 'antd'
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
        this.state = {
            source: "",
            notes: [],
            bridges: [],
            elements: [],
            followers: [],
            saveBoard: false
        }
        
        ipc.ask('INIT_SIDEBAR_DATA')
        .then(data => {
            const bridgeObj = data.data;
            SOURCE = data.SOURCE;
            this.setState({
                source: bridgeObj.via,
                bridges: bridgeObj.bridges || [],
                notes: bridgeObj.notes || [],
                elements: bridgeObj.elements || [],
                followers: bridgeObj.followers || [],
                saveBoard: data.saveBoard
            })
        })

    }

    scrollElement = (elem) => {
        const {source} = this.state
        ipc.ask("SCROLL_ELEMENT",{elem, source})
    }

    shareContent = (e, shareContent) => {
        e.preventDefault();
        const {followers, source} = this.state;
        ipc.ask("SHARE_CONTENT_SIDEBAR",{shareContent, followers, source})
    }

    render () {
        const { t } = this.props
        const { source, bridges, notes, elements, saveBoard } = this.state;

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

                {SOURCE && source === SOURCE.BRIDGE && bridges.length === 0 &&
                    <p className="blank-elements">Not any Bridge Yet!</p>
                }
                {SOURCE && source === SOURCE.NOTES && notes.length === 0 &&
                    <p className="blank-elements">Not any Notes Yet!</p>
                }
                {SOURCE && source === SOURCE.BOARD && !saveBoard &&
                    <p className="blank-elements">Not any Board Yet!</p>
                }

                {SOURCE && source === SOURCE.BRIDGE && bridges.map(bridge => {
                    return (
                        <React.Fragment key={bridge.id}>
                            <Card 
                            className="cursor"
                            extra={<Icon type="share-alt" className="cursor-1" onClick={(e) => this.shareContent(e, bridge)} />} 
                            hoverable
                            onClick={() => this.scrollElement(bridge)}
                            >
                                <p>{bridge.desc}</p>
                            </Card><br/>
                        </React.Fragment>
                    )
                })}

                {SOURCE && source === SOURCE.NOTES && notes.map(note => {
                    return (
                        <React.Fragment key={note.id}>
                            <Card
                            className="cursor"
                            title={note.title}
                            extra={<Icon type="share-alt" className="cursor-1" onClick={(e) => this.shareContent(e, note)} />} 
                            hoverable
                            onClick={() => this.scrollElement(note)}>
                                {/* <h4>{note.title}</h4> */}
                                <p>{note.desc}</p>
                            </Card><br/>
                        </React.Fragment>
                    )
                })}
                {SOURCE && source === SOURCE.BOARD && elements.map(element => {
                    if (element.saveBoard === 1) {
                        return (
                            <React.Fragment key={element.id}>
                                <Card
                                hoverable
                                extra={<Icon type="share-alt" className="cursor-1" onClick={(e) => this.shareContent(e, element)} />} 
                                onClick={() => this.scrollElement(element)}
                                >
                                <p>{element.text}</p>
                                </Card><br/>
                            </React.Fragment>
                        )
                    }
                })}

                </Drawer>
        </React.Fragment>

        )
    }
}

export default compose(
  translate(['common', 'bridgit_sidebar'])
)(App)
