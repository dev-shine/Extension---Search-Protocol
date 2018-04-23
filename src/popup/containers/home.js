import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators }  from 'redux'

import './home.scss'
import * as actions from '../actions'

class Home extends React.Component {
  render () {
    return (<div>Home</div>)
  }
}

export default connect(
  state => ({}),
  dispatch => bindActionCreators({...actions}, dispatch)
)(Home)
