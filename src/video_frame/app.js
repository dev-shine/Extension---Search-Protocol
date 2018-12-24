import React, { Component } from 'react'
import YouTube from 'react-youtube';
import { Icon, Row, Col } from 'antd'
import { translate } from 'react-i18next'

import { ipcForIframe } from '../common/ipc/cs_postmessage'
import { setIn, updateIn, compose } from '../common/utils'
import API from 'cs_api'
import './app.scss'

const ipc = ipcForIframe()

class App extends Component {
  
onReady = () => {
}

closeFrame = () => {
    ipc.ask('CLOSE_VIDEO_IFRAME');
}

onStateChange = (e) => {
    console.log("onStateChange :: ", e);
}

onPlay = (e) => {
    console.log("onPlay :: ", e);
}

onPause = (e) => {
    console.log("onPause :: ", e);
}

onPlaybackRateChange = (e) => {
    console.log("onPlaybackRateChange :: ", e);
    
}

render () {
    const opts = {
        height: '600',
        width: '600',
        playerVars: {             
          autoplay: 1,
        }
    };

    return (
        <React.Fragment>
            <Row>
                <Col span="23"></Col>
                <Col span="1"><Icon type="close" style={{marginTop: "10px", marginBottom: "10px", cursor: "pointer"}} onClick={this.closeFrame} /></Col>           
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
                <Col>
                </Col>
            </Row>

        </React.Fragment>
    )
  }
}

export default compose(
  translate(['common', 'video_frame'])
)(App)
