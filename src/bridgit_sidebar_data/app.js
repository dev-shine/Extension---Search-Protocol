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
let from_bridge_list, to_bridge_list;

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
            activeElements: [],
            element_id: '',
            user: null
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
                list_element: bridgeObj.list || '',
                followers: bridgeObj.followers || [],
                user: bridgeObj.user,
                saveBoard: data.saveBoard,
                activeElements: data.activeElements
            })
            if (bridgeObj.list)
                this.listElement(bridgeObj.list, bridgeObj.list.target);

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
                        list_element: bridgeObj.list || '',
                        followers: bridgeObj.followers || [],
                        user: bridgeObj.user,
                        saveBoard: data.saveBoard,
                        activeElements: data.activeElements,
                        isListElement: false
                    })
                    if (bridgeObj.list)
                        this.listElement(bridgeObj.list, bridgeObj.list.target);
                    return true
                }
            }  
        })


    }

    scrollElement = (elem) => {
        const {source} = this.state
        ipc.ask("SCROLL_ELEMENT",{elem, source})
    }

    onDragStart = (element, list) => {
        from_bridge = element;
        from_bridge_list = list;
    }

    onDrop = (element, list) => {
        if (!this.state.user) return
        to_bridge = element;
        to_bridge_list = list;

        if (from_bridge && to_bridge && from_bridge.id !== to_bridge.id) {
            ipc.ask("SIDEBAR_BRIDGE", {from_bridge, to_bridge, list: from_bridge_list});
        }
    }

    shareContent = (e, shareContent) => {
        e.preventDefault();
        const {followers, source} = this.state;
        ipc.ask("SHARE_CONTENT_SIDEBAR",{shareContent, followers, source})
    }

    annotate = (element, defaultData) => {
        ipc.ask("SIDEBAR_ANNOTATE",{element, defaultData})
    }

    listElement = (list, element_id) => {

        this.setState({
            isListElement: true,
            list_element: list,
            element_id
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
        const { source, bridges, notes, lists, elements, saveBoard, isListElement, list_element, activeElements, element_id, user } = this.state;

        if (isListElement) {
            return (
                <ListElement list={list_element} onListCancel = {this.listCancel} element_id={element_id}/>
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

                                        <img src="./img/list_sidebar.png" className="cursor-1" height="20" width="20" onClick={() => this.listElement('', element.id)} />&nbsp;&nbsp;
                                        { user && <img src="./img/notes_sidebar.png" className="cursor-1" height="20" width="20" onClick={() => this.annotate(element)} />} &nbsp;&nbsp;
                                        <Icon type="share-alt" className="cursor-1" onClick={(e) => this.shareContent(e, element)} />
                                    </React.Fragment>
                                }
                                hoverable
                                onDragStart = {() => this.onDragStart(element, '')}
                                onDragOver = {(event) => event.preventDefault()}
                                onDrop = {() => this.onDrop(element, '')}
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
                                    { user && <Icon type="edit" className="cursor-1" height="35" width="35" onClick={() => this.listElement(list, list.target)}/> } &nbsp;&nbsp;
                                    { user && <img src="./img/notes_sidebar.png" className="cursor-1" height="20" width="20" onClick={() => this.annotate(list.targetElement, list)} />} &nbsp;&nbsp;
                                    { user && <Icon type="share-alt" className="cursor-1" onClick={(e) => this.shareContent(e, list)} /> }
                                </React.Fragment>
                            } 
                            onDragStart = {() => this.onDragStart(list.targetElement, list)}
                            onDragOver = {(event) => event.preventDefault()}
                            onDrop = {() => this.onDrop(list.targetElement, list)}
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
                            extra={
                                <React.Fragment>
                                    {user && <img src="./img/notes_sidebar.png" className="cursor-1" height="20" width="20" onClick={() => this.annotate(bridge.fromElement ? bridge.fromElement : bridge.toElement , bridge)} />} &nbsp;&nbsp;
                                    <Icon type="share-alt" className="cursor-1" onClick={(e) => this.shareContent(e, bridge)} />
                                </React.Fragment>
                            }
                            onDragStart = {() => this.onDragStart(bridge.fromElement ? bridge.fromElement : bridge.toElement , bridge)}
                            onDragOver = {(event) => event.preventDefault()}
                            onDrop = {() => this.onDrop(bridge.fromElement ? bridge.fromElement : bridge.toElement, bridge)}
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
                            extra={
                                <React.Fragment>
                                    {user && <img src="./img/notes_sidebar.png" className="cursor-1" height="20" width="20" onClick={() => this.annotate(note.targetElement, note)} />} &nbsp;&nbsp;
                                    <Icon type="share-alt" className="cursor-1" onClick={(e) => this.shareContent(e, note)} />
                                </React.Fragment>
                            }
                            hoverable
                            onDragStart = {() => this.onDragStart(note.targetElement, note)}
                            onDragOver = {(event) => event.preventDefault()}
                            onDrop = {() => this.onDrop(note.targetElement, note)}
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
