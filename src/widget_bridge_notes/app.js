import React, { Component } from 'react'
import { Tabs, List, Row, Col, Icon } from 'antd';
import { translate } from 'react-i18next'

import { ipcForIframe } from '../common/ipc/cs_postmessage'
import { setIn, updateIn, compose } from '../common/utils'
import API from 'cs_api'
import { notifyError, notifySuccess } from '../components/notification'
import './app.scss'
const { TabPane } = Tabs;

const ipc = ipcForIframe()

const tab_type = {
    "bridges": 0,
    "notes": 1
}

const notes = [
    {
        id: "1",
        title: "Notes1",
        relation: "Quotations",
        desc: "In most business situations, Ant Design needs to solve a lot of information storage problems within the design area, so based on 12 Grids System, we divided the design area into 24 aliquots.",
        tags: "design,look",
        created_by: "Nikunj"
    },
    {
        id: "2",
        title: "Notes2",
        relation: "SUPPORTS",
        desc: "We name the divided area 'box'. We suggest four boxes for horizontal arrangement at most, one at least. Boxes are proportional to the entire screen as shown in the picture above. To ensure a high level of visual comfort, we customize the typography inside of the box based on the box unit.",
        tags: "action,test",
        created_by: "Dave Room"

    },
    {
        id: "3",
        title: "Note3",
        relation: "Analysis",
        desc: "Our grid systems support Flex layout to allow the elements within the parent to be aligned horizontally - left, center, right, wide arrangement, and decentralized arrangement. The Grid system also supports vertical alignment - top aligned, vertically centered, bottom-aligned. You can also define the order of elements by using order.",
        tags: "grid,support",
        created_by: "Alsis"

    },
    {
        id: "4",
        title: "Notes1",
        relation: "Quotations",
        desc: "In most business situations, Ant Design needs to solve a lot of information storage problems within the design area, so based on 12 Grids System, we divided the design area into 24 aliquots.",
        tags: "design,look",
        created_by: "Nikunj"
    },
    {
        id: "5",
        title: "Notes2",
        relation: "SUPPORTS",
        desc: "We name the divided area 'box'. We suggest four boxes for horizontal arrangement at most, one at least. Boxes are proportional to the entire screen as shown in the picture above. To ensure a high level of visual comfort, we customize the typography inside of the box based on the box unit.",
        tags: "action,test",
        created_by: "Dave Room"

    },
    {
        id: "6",
        title: "Note3",
        relation: "Analysis",
        desc: "Our grid systems support Flex layout to allow the elements within the parent to be aligned horizontally - left, center, right, wide arrangement, and decentralized arrangement. The Grid system also supports vertical alignment - top aligned, vertically centered, bottom-aligned. You can also define the order of elements by using order.",
        tags: "grid,support",
        created_by: "Alsis"

    }


]

const bridges = [
    {
        id: "1",
        relation: "Supported By",
        desc: "In most business situations, Ant Design needs to solve a lot of information storage problems within the design area, so based on 12 Grids System, we divided the design area into 24 aliquots.",
        tags: "business,situations",
        created_by: "Nikunj Chotaliya"
    },
    {
        id: "2",
        relation: "Contradicted By",
        desc: "Our grid systems support Flex layout to allow the elements within the parent to be aligned horizontally - left, center, right, wide arrangement, and decentralized arrangement. The Grid system also supports vertical alignment - top aligned, vertically centered, bottom-aligned. You can also define the order of elements by using order.",
        tags: "grid,systems",
        created_by: "Dave room"
    },
    {
        id: "3",
        relation: "Ralation By",
        desc: "We name the divided area 'box'. We suggest four boxes for horizontal arrangement at most, one at least. Boxes are proportional to the entire screen as shown in the picture above. To ensure a high level of visual comfort, we customize the typography inside of the box based on the box unit.",
        tags: "arrangement,box",
        created_by: "Alias"
    }
]

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            bridges: [],
            notes: []
        }
    }

    componentDidMount() {
        ipc.ask("INIT")
        .then(result => {
            this.setState({
                bridges: result.bridges,
                notes: result.annotations
            })
            
        })
    }

    tabChange = (tab) => {
        console.log(tab);
    }

    closeTab = () => {
        ipc.ask("DESTROY");
    }

    render () {
        // const {bridges, notes} = this.state;
        return (
            <div>
                <Tabs onChange={this.tabChange} defaultActiveKey="1" type="card">


                    <TabPane tab="Bridges" key={tab_type.bridges}>
                        <Row>
                            <Col span="23"></Col>
                            <Col span="1"><Icon type="close" style={{cursor: 'pointer'}} onClick={this.closeTab} /></Col>
                        </Row>
                        {
                            bridges.length > 0 &&
                            bridges.map(bridge => {
                                return (
                                    <React.Fragment key={bridge.id}>
                                        <Row>
                                            <Col span={4}></Col>
                                            <Col span={10}>
                                                <h2 style={{color: "#ff8095"}} >{bridge.relation}</h2>
                                                <p>{bridge.desc}</p>
                                                <Col span={16}>
                                                    {bridge.tags.split(",").map((tag, i) => {
                                                        return (
                                                            <span key={i} style={{marginRight: '5px', color: "white", fontSize: "20px", backgroundColor: "#ff8095"}}>{tag}</span>
                                                        )
                                                    })}
                                                </Col>
                                                <Col span={8}>
                                                    <span style={{fontSize:"15px", color: "#ff8095"}}>{bridge.created_by}</span>
                                                </Col>

                                            </Col>
                                        </Row><hr/>
                                    </React.Fragment>
                                )
                            })
                        }
                    </TabPane>




                    <TabPane tab="Notes" key={tab_type.notes}>
                        <Row>
                                <Col span="23"></Col>
                                <Col span="1"><Icon type="close" style={{cursor: 'pointer'}} onClick={this.closeTab} /></Col>
                        </Row>

                        {
                            notes.length > 0 &&
                            notes.map(note => {
                                return (    
                                    <React.Fragment key={note.id}>
                                    <Row>
                                        <Col span={4}></Col>
                                        <Col span={10}>
                                            <p style={{fontSize: "18px", color: "#ff8095"}} >{note.title}</p>
                                            <p>{note.desc}</p>
                                            {note.tags.split(",").map((tag, i) => {
                                                return (
                                                    <span key={i} style={{marginRight: '5px', color: "white", fontSize: "20px", backgroundColor: "#ff8095"}}>{tag}</span>
                                                )
                                            })}
                                            <br/>
                                        </Col>
                                        <Col span={4}>
                                            <h4 style={{backgroundColor: "#ff8095", color: "white"}}>{note.relation}</h4>
                                        </Col>
                                    </Row><hr/>
                                    </React.Fragment>
                                )
                            })
                        }
                    </TabPane>
                </Tabs>
            </div>
        )
    }
}

export default compose(
  translate(['common', 'widgetBridgeNotes'])
)(App)
