import React, { Component } from 'react'
import YouTube from 'react-youtube';
import { Icon, Row, Col, Button, InputNumber } from 'antd'
import { translate } from 'react-i18next'

import { ipcForIframe } from '../common/ipc/cs_postmessage'
import { setIn, updateIn, compose } from '../common/utils'
import API from 'cs_api'
import './app.scss'

const ipc = ipcForIframe()

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            start_minute: '0',
            start_second: '0',
            end_minute: '0',
            end_second: '0',
            isButtonDisabled: true
        }
    }

onReady = () => {
}

closeFrame = () => {
    ipc.ask('CLOSE_VIDEO_IFRAME');
}

beginBridge = () => {
    ipc.ask('BEGIN_BRIDGE');
}

buildBridge = () => {
    ipc.ask('BUILD_BRIDGE');
}

annotate = () => {
    ipc.ask('ANNOTATE');
}

onStateChange = (e) => {
}

onPlay = (e) => {
}

onPause = (e) => {
}

onPlaybackRateChange = (e) => {
}

onTimeChange = (value, name) => {

    if (isNaN(value) || value < 0) return true
    value = value == "" ? 0 : value;

    const start_minute = name == "start_minute" ? parseInt(value) : parseInt(this.state.start_minute);
    const start_second = name == "start_second" ? parseInt(value) : parseInt(this.state.start_second);
    const end_minute = name == "end_minute" ? parseInt(value) : parseInt(this.state.end_minute);
    const end_second = name == "end_second" ? parseInt(value) : parseInt(this.state.end_second);

    let isButtonDisabled = this.state.isButtonDisabled;

    let start_seconds = 0, end_seconds = 0;
    start_seconds = start_minute * 60 + start_second;
    end_seconds = end_minute * 60 + end_second;    
    if (end_seconds > start_seconds) isButtonDisabled = false
    else isButtonDisabled = true

    this.setState({
        [name]: value,
        isButtonDisabled: isButtonDisabled
    })

}

render () {
    const { t } = this.props
    const { isButtonDisabled } = this.state

    const opts = {
        height: '550',
        width: '600',
        playerVars: {
          autoplay: 1,
        }
    };

    return (
        <React.Fragment>
            <Row>
                <Col span="23"></Col>
                <Col span="1"><Icon type="close" className="icon-style" onClick={this.closeFrame} /></Col>           
            </Row>
            <Row>
                <YouTube
                    videoId="BNHR6IQJGZs"
                    opts={opts}
                    onPlay = {this.onPlay}
                    onReady={this.onReady}
                    onPlaybackRateChange={this.onPlaybackRateChange} 
                    onPause={this.onPause}
                    onStateChange={this.onStateChange}
                /> 
            </Row>

            <Row>
                <Col className="time-section" span="12">
                    Start Time
                </Col>
                <Col className="time-section" span="12">
                    End Time
                </Col>

            </Row>

            <Row>
                <Col span="1"/>
                <Col span="5">
                    Minute: <InputNumber size="small" min={0} max={60} className="minute-time" onChange={val => this.onTimeChange(val, "start_minute")} name="start_minute" defaultValue="0" placeholder="Minute"/>
                </Col>
                <Col span="5">
                    Second: <InputNumber size="small" className="minute-time" onChange={val => this.onTimeChange(val, "start_second")} name="start_second" defaultValue="0" placeholder="Second"/>
                </Col>

                <Col span="2"/>
                <Col span="5">
                    Minute: <InputNumber size="small" className="minute-time" onChange={val => this.onTimeChange(val, "end_minute")} name="end_minute" defaultValue="0" placeholder="Minute"/>
                </Col>
                <Col span="5">
                    Second: <InputNumber size="small" className="minute-time" onChange={val => this.onTimeChange(val, "end_second")} name="end_second" defaultValue="0" placeholder="Second"/>
                </Col>

            </Row>

            <Row>
                <Col span="6">
                    <Button
                        type="primary"
                        size="default"
                        className="btn-style"
                        onClick={this.beginBridge}
                        disabled={isButtonDisabled}
                    >
                        {t('createBridge')}
                    </Button>
                </Col>
                <Col span="6">
                    <Button
                            type="primary"
                            size="default"
                            className="btn-style"
                            onClick={this.buildBridge}
                            disabled={isButtonDisabled}
                        >
                            {t('buildBridge')}
                    </Button>
                </Col>
                <Col span="6">
                    <Button
                            type="primary"
                            size="default"
                            className="btn-style"
                            onClick={this.annotate}
                            disabled={isButtonDisabled}
                        >
                            {t('annotate')}
                    </Button>
                </Col>
                <Col span="6">
                    <Button
                            type="primary"
                            size="default"
                            className="btn-style"
                            onClick={this.closeFrame}
                        >
                            {t('cancel')}
                    </Button>
                </Col>

            </Row>

        </React.Fragment>
    )
  }
}

export default compose(
  translate(['common', 'video_frame'])
)(App)
