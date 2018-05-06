import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter, Link } from 'react-router-dom'

import './header.scss'
import * as actions from '../actions'
import { compose } from '../../common/utils'
import { LINK_PAIR_STATUS } from '../../common/models/local_annotation_model'
import UserInfo from '../components/user_info'

class Header extends React.Component {
  componentDidMount () {
    const { history } = this.props

    this.props.setRoute(history.location.pathname)
    this.props.history.listen((location, action) => {
      this.props.setRoute(history.location.pathname)
    })
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.userInfo !== this.props.userInfo || nextProps.linkPair !== this.props.linkPair) {
      const { linkPair, userInfo } = nextProps
      const nextRoute = (function () {
        if (!userInfo)  return '/login'
        if (userInfo.user_activate === '0') return '/user-inactive'

        switch (linkPair && linkPair.status) {
          case LINK_PAIR_STATUS.EMPTY:      return '/'
          case LINK_PAIR_STATUS.ONE:        return '/annotate-step-1'
          case LINK_PAIR_STATUS.TWO:        return '/annotate-step-2'
          case LINK_PAIR_STATUS.READY:      return '/create-link'
          default:                          return 'Unknown status'
        }
      })()

      this.navigate(nextRoute)
    }
  }

  navigate (route) {
    if (this.props.route === route) return
    this.props.history.push(route)
  }

  render () {
    return [
      <div className="header" key="0">
        <Link to="/">Bridgit</Link>
      </div>,
      this.props.userInfo ? <UserInfo key="1" /> : null
    ]
  }
}

export default compose(
  connect(
    state => ({
      route:      state.route,
      userInfo:   state.userInfo,
      linkPair:   state.linkPair
    }),
    dispatch  => bindActionCreators({...actions}, dispatch)
  ),
  withRouter
)(Header)
