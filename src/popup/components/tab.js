import React from 'react'
import PropTypes from 'prop-types'
import { cn } from '../../common/utils'
import './tab.scss'

class Pane extends React.Component {
  static propTypes = {
    tab:    PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
    name:   PropTypes.string,
    active: PropTypes.bool,
    nullable: PropTypes.bool
  }

  render () {
    if (this.props.nullable && !this.props.active) {
      return null
    }

    return (
      <div className={cn('tab-pane', { active: this.props.active })}>
        {this.props.children}
      </div>
    )
  }
}

class TabTitle extends React.Component {
  static propTypes = {
    name:     PropTypes.string.isRequired,
    active:   PropTypes.bool.isRequired,
    onClick:  PropTypes.func.isRequired
  }

  render () {
    return (
      <div className={cn('tab-title', { active: this.props.active })} onClick={() => this.props.onClick(this.props.name)}>
        {this.props.children}
      </div>
    )
  }
}

export default class Tab extends React.Component {
  static Pane = Pane

  static propTypes = {
    defaultActiveName:  PropTypes.string,
    activeName:         PropTypes.string,
    className:          PropTypes.string,
    onTabChange:        PropTypes.func,
    mode:               PropTypes.oneOf(['hide', 'null'])
  }

  static defaultProps = {
    mode: 'null'
  }

  state = {
    activeName: null
  }

  onClickTab = (name) => {
    if (name !== this.state.activeName) {
      this.setState({ activeName: name })

      if (this.props.onTabChange) {
        this.props.onTabChange(name, this.props.activeName)
      }
    }
  }

  componentDidMount () {
    this.setState({ activeName: this.props.activeName })
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.activeName !== this.props.activeName) {
      this.setState({ activeName: nextProps.activeName })
    }
  }

  getTabs () {
    const comps = Array.from(this.props.children).filter(item => item.type === Pane)
    const names = comps.map(pane => pane.props.name)
    const { activeName = this.props.defaultActiveName || names[0] } = this.state
    const tabs  = comps.map(pane => (
      <TabTitle
        key={pane.props.name}
        name={pane.props.name}
        active={activeName === pane.props.name}
        onClick={this.onClickTab}
      >
        {pane.props.tab}
      </TabTitle>
    ))
    const panes = comps.map(pane => (
      <Pane
        {...pane.props}
        active={activeName === pane.props.name}
        key={pane.props.name}
        nullable={this.props.mode === 'null'}
      ></Pane>
    ))

    return { tabs, panes }
  }

  render () {
    const { tabs, panes } = this.getTabs()

    return (
      <div className={cn('tab', this.props.className)}>
        <div className="tab-titles">{tabs}</div>
        <div className="tab-panes">{panes}</div>
      </div>
    )
  }
}
