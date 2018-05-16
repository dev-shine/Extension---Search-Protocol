import React from 'react'
import PropTypes from 'prop-types'
import './clamp_pre.scss'

class ClampPre extends React.Component {
  static propTypes = {
    lines: PropTypes.number
  }

  static defaultProps = {
    lines: 3
  }

  state = {
    ready: false,
    needClamp: false,
    fold: false
  }

  toggleFold = () => {
    this.setState({
      fold: !this.state.fold
    })
  }

  componentDidMount () {
    setTimeout(() => {
      const $pre = this.$pre
      const fullHeight = $pre.offsetHeight

      $pre.style.display  = '-webkit-box'
      const partialHeight = $pre.offsetHeight
      const needClamp     = fullHeight > partialHeight

      console.log('partial, full, needClamp', partialHeight, fullHeight, needClamp)

      $pre.removeAttribute('style')

      this.setState({
        needClamp,
        fold: needClamp,
        ready: true
      })
    }, 100)
  }

  renderShowAllButton () {
    if (!this.state.ready || !this.state.needClamp) return null

    return (
      <span className="action-button" onClick={this.toggleFold}>
        {this.state.fold ? 'Show all ▼' : 'Hide ▲'}
      </span>
    )
  }

  render () {
    const { needClamp, fold } = this.state

    return (
      <div
        className={'clamp-pre ' + (fold ? 'fold' : '')}
        style={{ visiblity: this.state.ready ? 'visible' : 'hidden' }}
      >
        <pre
          ref={ref => { this.$pre = ref }}
        >
          {this.props.children}
        </pre>
        {this.renderShowAllButton()}
      </div>
    )
  }
}

export default ClampPre
