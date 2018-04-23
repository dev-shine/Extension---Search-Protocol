import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter, Link } from 'react-router-dom'

import './header.scss'
import * as actions from '../actions'

class Header extends React.Component {
  componentDidMount () {
    const { history } = this.props

    this.props.setRoute(history.location.pathname)
    this.props.history.listen((location, action) => {
      this.props.setRoute(history.location.pathname)
    })
  }

  render () {
    return (
      <div className="header">
        Bridgit
      </div>
    )
  }
}

export default connect(
  state => ({ route: state.route }),
  dispatch  => bindActionCreators({...actions}, dispatch)
)(withRouter(Header))
