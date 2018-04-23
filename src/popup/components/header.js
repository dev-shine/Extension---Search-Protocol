import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { withRouter, Link } from 'react-router-dom'

import './header.scss'
import * as actions from '../actions'
import Msg from './msg'

class Header extends React.Component {
  componentDidMount () {
    const { history } = this.props

    this.props.setRoute(history.location.pathname)
    this.props.history.listen((location, action) => {
      this.props.setRoute(history.location.pathname)
    })
  }

  render () {
    const { route, st, urls } = this.props
    const routes = [
      { url: '/dashboard',  name: 'Dashboard' },
      { url: '/add',        name: 'Add' },
      { url: '/settings',   name: 'Settings' }
    ]

    return (
      <div>
        <ul className="tab-menus">
          {routes.map(r => (
            <li className={r.url === route ? 'active' : ''} key={r.url}>
              <Link to={r.url}>{r.name}</Link>
            </li>
          ))}
        </ul>

        <Msg {...this.props.msg} onClose={this.props.closeMsg} />
      </div>
    )
  }
}

export default connect(
  state => ({ route: state.route, msg: state.msg }),
  dispatch  => bindActionCreators({...actions}, dispatch)
)(withRouter(Header))
