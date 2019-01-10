import React, { Component } from 'react'
import { Drawer, Card, Icon } from 'antd'
import { translate } from 'react-i18next'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import { setIn, updateIn, compose } from '../common/utils'
import './app.scss'
import ListElement from './list_element';

const ipc = ipcForIframe()

let SOURCE;
let from_bridge, to_bridge;
let from_bridge_privacy, to_bridge_privacy;

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            source: "",
            notes: [],
            bridges: [],
            elements: [],
            lists: [],
            followers: [],
            saveBoard: false,
            isListElement: false,
            list_element: '',
            activeElements: []
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
                lists: bridgeObj.lists || [],
                followers: bridgeObj.followers || [],
                saveBoard: data.saveBoard,
                activeElements: data.activeElements
            })
        })

        ipc.onAsk((cmd, args) => {

            switch (cmd) {
      
                case 'RELOAD_SIDEBAR_DATA':
                {
                    const data = args;
                    const bridgeObj = data.data;
                    SOURCE = data.SOURCE;
                    this.setState({
                        source: bridgeObj.via,
                        bridges: bridgeObj.bridges || [],
                        notes: bridgeObj.notes || [],
                        elements: bridgeObj.elements || [],
                        lists: bridgeObj.lists || [],
                        followers: bridgeObj.followers || [],
                        saveBoard: data.saveBoard,
                        activeElements: data.activeElements
                    })
                    return true
                }
            }  
        })


    }

    scrollElement = (elem) => {
        const {source} = this.state
        ipc.ask("SCROLL_ELEMENT",{elem, source})
    }

    onDragStart = (element, privacy) => {
        from_bridge = element;
        from_bridge_privacy = privacy;
    }

    onDrop = (element, privacy) => {
        to_bridge = element;
        to_bridge_privacy = privacy;

        if (from_bridge && to_bridge && from_bridge.id !== to_bridge.id) {
            let privacy = (from_bridge_privacy === to_bridge_privacy) ? to_bridge_privacy : '';
            ipc.ask("SIDEBAR_BRIDGE", {from_bridge, to_bridge, privacy});
        }
    }

    shareContent = (e, shareContent) => {
        e.preventDefault();
        const {followers, source} = this.state;
        ipc.ask("SHARE_CONTENT_SIDEBAR",{shareContent, followers, source})
    }

    annotate = (element, privacy) => {
        ipc.ask("SIDEBAR_ANNOTATE",{element, privacy})
    }

    listElement = (element) => {

        this.setState({
            isListElement: true,
            list_element: element
        })
    }

    listCancel = () => {
        this.setState({
            isListElement: false,
            list_element: ''
        })
    }

    render () {
        const { t } = this.props
        const { source, bridges, notes, lists, elements, saveBoard, isListElement, list_element, activeElements } = this.state;

        if (isListElement) {
            return (
                <ListElement element={list_element} onListCancel = {this.listCancel}/>
            )
        }

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
                {SOURCE && source === SOURCE.LIST && lists.length === 0 &&
                    <p className="blank-elements">There is no List Yet!</p>
                }
                {SOURCE && source === SOURCE.BOARD && !saveBoard &&
                    <p className="blank-elements">Add Selection to See Elements!</p>
                }

                {SOURCE && source === SOURCE.BOARD && elements.map(element => {
                    if (element.saveBoard === 1) {
                        return (
                            <React.Fragment key={element.id}>
                                <Card
                                hoverable
                                draggable={true}
                                style={{backgroundColor: activeElements.includes(element.id) ? "#d4d4d4" : 'white'}}
                                extra={
                                    <React.Fragment>
                                        
                                        <img src="./img/list_sidebar.png" className="cursor-1" height="20" width="20" onClick={() => this.listElement(element)} />&nbsp;&nbsp;
                                        <Icon type="share-alt" className="cursor-1" onClick={(e) => this.shareContent(e, element)} />
                                    </React.Fragment>
                                }
                                onClick={() => this.scrollElement(element)}
                                >
                                <p>{element.text}</p>
                                </Card><br/>
                            </React.Fragment>
                        )
                    }
                })}


                {SOURCE && source === SOURCE.LIST && lists.map(list => {
                    return (
                        <React.Fragment key={list.id}>
                            <Card
                            className="cursor"
                            title={list.title}
                            draggable={true}
                            style={{backgroundColor: activeElements.includes(list.target) ? "#d4d4d4" : 'white'}}
                            extra={
                                <React.Fragment>
                                    <img src="./img/notes_sidebar.png" className="cursor-1" height="20" width="20" onClick={() => this.annotate(list.targetElement, list.privacy)} />
                                </React.Fragment>
                            } 
                            onDragStart = {() => this.onDragStart(list.targetElement, list.privacy)}
                            onDragOver = {(event) => event.preventDefault()}
                            onDrop = {() => this.onDrop(list.targetElement, list.privacy)}
                            onClick={() => this.scrollElement(list.targetElement)}
                            hoverable
                            onClick={() => this.scrollElement(list)}>
                                <p>{list.desc}</p>
                            </Card><br/>
                        </React.Fragment>
                    )
                })}


                {SOURCE && source === SOURCE.BRIDGE && bridges.map(bridge => {
                    return (
                        <React.Fragment key={bridge.id}>
                            <Card 
                            className="cursor"
                            style={{backgroundColor: activeElements.includes(bridge.from) || activeElements.includes(bridge.to) ? "#d4d4d4" : 'white'}}
                            draggable={true}
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
                            style={{backgroundColor: activeElements.includes(note.target) ? "#d4d4d4" : 'white'}}
                            draggable={true}
                            extra={<Icon type="share-alt" className="cursor-1" onClick={(e) => this.shareContent(e, note)} />} 
                            hoverable
                            onClick={() => this.scrollElement(note)}>
                                {/* <h4>{note.title}</h4> */}
                                <p>{note.desc}</p>
                            </Card><br/>
                        </React.Fragment>
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
