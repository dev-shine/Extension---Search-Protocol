import { and, setIn, updateIn, compose } from '../utils'

export const LOCAL_BRIDGE_STATUS = {
  EMPTY:    'EMPTY',
  ONE:      'ONE',
  TWO:      'TWO',
  READY:    'READY',
  TOO_MANY: 'TOO_MANY'
}

export const LOCAL_STATUS = {
  NEW_BRIDGE:   'NEW_BRIDGE',
  EDIT_BRIDGE:  'EDIT_BRIDGE'
}

export const EDIT_BRIDGE_TARGET = {
  FROM: 'FROM',
  TO:   'TO',
  NIL:  'NIL'
}

export class LocalModel {
  state = {
    status: LOCAL_STATUS.NEW_BRIDGE,
    bridge: {
      from: null,
      to: null,
      id: null
    },
    editBridge: {
      target: EDIT_BRIDGE_TARGET.FROM
    },
    lastAnnotation: null
  }

  getLocalBridgeStatus () {
    const { bridge } = this.state

    if (bridge.from && bridge.to) {
      return LOCAL_BRIDGE_STATUS.READY
    }

    if (bridge.from) {
      return LOCAL_BRIDGE_STATUS.ONE
    }

    return LOCAL_BRIDGE_STATUS.EMPTY
  }

  getLocalBridge () {
    return {
      ...this.state,
      links: [
        this.state.bridge.from,
        this.state.bridge.to
      ]
    }
  }

  resetLocalBridge () {
    this.__setState({
      bridge: {
        from: null,
        to: null,
        id: null
      },
      lastAnnotation: null
    })
  }

  setLocalBridge (bridge, lastAnnotation) {
    this.__setState({
      bridge,
      lastAnnotation: lastAnnotation || null
    })
  }

  addElementToLocalBridge (element) {
    const { target } = this.state.editBridge

    switch (target) {
      case EDIT_BRIDGE_TARGET.FROM:
        return this.__setState(
          compose(
            setIn(['bridge', 'from'], element),
            setIn(['editBridge', 'target'], EDIT_BRIDGE_TARGET.TO)
          )(this.state)
        )

      case EDIT_BRIDGE_TARGET.TO:
        return this.__setState(
          compose(
            setIn(['bridge', 'to'], element),
            setIn(['editBridge', 'target'], EDIT_BRIDGE_TARGET.NIL)
          )(this.state)
        )

      default:
        throw new Error(`Invalid target status to addElementToLocalBridge`, target)
    }
  }

  setLastAnnotation (annotation) {
    this.__setState({ lastAnnotation: annotation })
  }

  editBridge (bridge, target) {
    this.__setState({
      bridge,
      editBridge: { target }
    })
  }

  __setState (obj = {}) {
    this.state = {...this.state, ...obj}
  }
}

let instance

export function getLinkPair () {
  if (instance) return instance
  instance = new LocalModel()
  return instance
}
