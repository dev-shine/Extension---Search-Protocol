import React, { Component } from 'react'
import { Button } from 'antd'
import { notifyError, notifySuccess } from '../components/notification'
import { ipcForIframe } from '../common/ipc/cs_postmessage'
import API from '../common/api/cs_api'
import log from '../common/log'
import { Box, getAnchorRects, BOX_ANCHOR_POS } from '../common/shapes/box'
import './app.scss'
import { pixel, dataUrlFromImageElement } from '../common/dom_utils'
import { LINK_PAIR_STATUS } from '../common/models/local_annotation_model'

const ipc = ipcForIframe()

class App extends Component {
  state = {
    linkPair: null,
    status: null,
    linkData: null,
    cropRect: null,
    image: {
      dataUrl: null,
      width: 0,
      height: 0
    }
  }

  canBuildBridge = () => {
    const { linkPair } = this.state
    if (!linkPair)  return false
    return linkPair.status === LINK_PAIR_STATUS.ONE || linkPair.data.lastAnnotation
  }

  prepareLinkData = () => {
    return dataUrlFromImageElement(this.$img, this.state.cropRect)
    .then(({ dataUrl }) => {
      return {
        ...this.state.linkData,
        rect:   this.state.cropRect,
        image:  dataUrl
      }
    })
  }

  onClickAnnotate = () => {
    this.prepareLinkData()
    .then(linkData => {
      return ipc.ask('ANNOTATE', { linkData })
    })
    .catch(e => log.error(e.stack))
  }

  onClickCreateBridge = () => {
    this.prepareLinkData()
    .then(linkData => ipc.ask('CREATE_BRIDGE', { linkData }))
    .catch(e => log.error(e.stack))
  }

  onClickBuildBridge = () => {
    this.prepareLinkData()
    .then(linkData => ipc.ask('BUILD_BRIDGE', { linkData }))
    .catch(e => log.error(e.stack))
  }

  onClickCancel = () => {
    ipc.ask('CLOSE')
  }

  onMouseMove = (e) => {
    switch (this.state.status) {
      case 'moving_box': {
        this.state.box.moveBox({
          dx: e.pageX - this.state.startPos.x,
          dy: e.pageY - this.state.startPos.y
        })
        break
      }

      case 'moving_anchor': {
        const containerRect = this.$container.getBoundingClientRect()
        const x = e.clientX - containerRect.left
        const y = e.clientY - containerRect.top

        this.state.box.moveAnchor({ x, y })
        break
      }
    }
  }

  onMouseUp = (e) => {
    switch (this.state.status) {
      case 'moving_box':
        this.state.box.moveBoxEnd()
        break

      case 'moving_anchor':
        this.state.box.moveAnchorEnd()
        break
    }

    this.setState({ status: null })
  }

  componentDidMount () {
    ipc.ask('INIT')
    .then(({ linkPair, linkData, dataUrl, width, height }) => {
      const box = new Box({
        width,
        height,
        x: 0,
        y: 0,
        firstSilence: false,
        onStateChange: ({ rect }) => {
          log('box onStateChange', rect)
          this.setState({ cropRect: rect })
        },
        normalizeRect: (rect, action) => {
          if (action === 'moveAnchor') {
            return {
              x:      Math.max(0, rect.x),
              y:      Math.max(0, rect.y),
              width:  Math.min(rect.width, width - rect.x),
              height: Math.min(rect.height, height - rect.y)
            }
          } else if (action === 'moveBox') {
            const dx = (function () {
              if (rect.x < 0)  return -1 * rect.x
              if (rect.x + rect.width > width)  return (width - rect.x - rect.width)
              return 0
            })()
            const dy = (function () {
              if (rect.y < 0)  return -1 * rect.y
              if (rect.y + rect.height > height)  return (height - rect.y - rect.height)
              return 0
            })()

            return {
              x:      rect.x + dx,
              y:      rect.y + dy,
              width:  rect.width,
              height: rect.height
            }
          }
        }
      })

      this.setState({
        box,
        linkData,
        linkPair,
        image: {
          dataUrl,
          width,
          height
        }
      })
    })
  }

  renderCropArea () {
    const { cropRect } = this.state
    if (!cropRect)  return null

    const klass = {
      TOP_LEFT:     'lt',
      TOP_RIGHT:    'rt',
      BOTTOM_RIGHT: 'rb',
      BOTTOM_LEFT:  'lb'
    }
    const anchorPos = Object.keys(BOX_ANCHOR_POS).map(key => ({
      key,
      className:  klass[key],
      value:      BOX_ANCHOR_POS[key]
    }))

    return (
      <div
        className="crop-area"
        style={{
          top:    pixel(cropRect.y),
          left:   pixel(cropRect.x),
          width:  pixel(cropRect.width),
          height: pixel(cropRect.height)
        }}
        onMouseDown={(e) => {
          this.state.box.moveBoxStart()
          this.setState({
            status: 'moving_box',
            startPos: {
              x: e.pageX,
              y: e.pageY
            }
          })
        }}
      >
        {anchorPos.map(item => (
          <div
            key={item.key}
            className={`anchor ${item.className}`}
            onMouseDown={(e) => {
              e.stopPropagation()
              this.state.box.moveAnchorStart({ anchorPos: item.value })
              this.setState({ status: 'moving_anchor' })
            }}
          >
          </div>
        ))}
      </div>
    )
  }

  render () {
    return (
      <div
        className="select-area-wrapper"
        onMouseMove={this.onMouseMove}
        onMouseUp={this.onMouseUp}
      >
        <div
          ref={r => { this.$container = r }}
          className="image-wrapper"
          style={{
            width: this.state.image.width,
            height: this.state.image.height
          }}
        >
          <img src={this.state.image.dataUrl} ref={r => { this.$img = r }}/>
          {this.renderCropArea()}
        </div>
        <div className="actions">
          <Button
            type="primary"
            size="large"
            className="save-button"
            onClick={this.onClickAnnotate}
          >
            Annotate
          </Button>
          <Button
            type="primary"
            size="large"
            className="create-bridge-button"
            onClick={this.onClickCreateBridge}
          >
            Create Bridge
          </Button>
          {this.canBuildBridge() ? (
            <Button
              type="primary"
              size="large"
              className="build-bridge-button"
              onClick={this.onClickBuildBridge}
            >
              Build Bridge
            </Button>
          ) : null}
          <Button
            type="danger"
            size="large"
            className="cancel-button"
            onClick={this.onClickCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }
}

export default App
