import React from 'react'
import './footer.scss'

class Footer extends React.Component {
  render () {
    return (
      <div className="footer">
        <span>2017 &copy; Bridgit | All Rights Reserved</span>
        <br/>
        <a href="http://bridgit.io/" target="_blank">Terms &amp; Conditions</a>
        <a href="http://bridgit.io/" target="_blank">About</a>
      </div>
    )
  }
}

export default Footer
