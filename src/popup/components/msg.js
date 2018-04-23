import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import './msg.scss'
import * as actions from '../actions'

class Msg extends React.Component {
  close = () => {
    if (this.state.handler) {
      clearTimeout(this.state.handler)
    }

    this.props.onClose()
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.shouldShow === true && nextProps.shouldShow !== this.props.shouldShow) {
      this.setState({
        handler: setTimeout(() => {
          this.close()
        }, nextProps.timeout || 3000)
      })
    }
  }

  render () {
    const { shouldShow, type, text } = this.props

    return (
      <div className="msg" style={{ display: shouldShow ? 'block' : 'none' }}>
        <div className="msg-mask" onClick={this.close}></div>
        <div className={'msg-text ' + type}>
          {text}
        </div>
      </div>
    )
  }
}

export default connect(
  state => ({ ...state.msg }),
  dispatch  => bindActionCreators({...actions}, dispatch)
)(Msg)
