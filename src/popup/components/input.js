import React from 'react'

class Input extends React.Component {
  componentWillReceiveProps (newProps) {
    if (this.props.value !== newProps.value) {
      this.input.value = newProps.value
    }
  }

  render () {
    const props = {
      ...this.props
    }

    if (this.props.value) {
      props.defaultValue = this.props.value
      delete props.value
    }

    return (
      <input {...props} ref={input => { this.input = input }} />
    )
  }
}

export default Input
