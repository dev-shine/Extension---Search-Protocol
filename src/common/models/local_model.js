import { and, setIn, updateIn, compose } from '../utils'
import log from '../log';

export const LOCAL_BRIDGE_STATUS = {
  EMPTY:    'EMPTY',
  ONE:      'ONE',
  TWO:      'TWO',
  READY:    'READY',
  EDITING:  'EDITING',
  TOO_MANY: 'TOO_MANY'
}

export const EDIT_BRIDGE_TARGET = {
  FROM: 'FROM',
  TO:   'TO',
  NIL:  'NIL'
}

export class LocalModel {
  state = {
    bridge: {
      from: null,
      to: null,
      id: null
    },
    editBridge: {
      target: EDIT_BRIDGE_TARGET.FROM
    },
    element_id: null,
    lastAnnotation: null
  }

  getLocalBridgeStatus () {
    const { bridge } = this.state

    if (bridge.id) {
      return LOCAL_BRIDGE_STATUS.EDITING
    }

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

  getElementId () {
    return {
      element_id: this.state.element_id
    }
  }

  resetLocalBridge () {
    this.__setState({
      bridge: {
        from: null,
        to: null,
        id: null
      },
      element_id: null,
      lastAnnotation: null,
      editBridge: {
        target: EDIT_BRIDGE_TARGET.FROM
      }
    })
  }

  setLocalBridge (bridge, lastAnnotation) {
    this.__setState({
      bridge,
      lastAnnotation: lastAnnotation || null
    })
  }

  updateLocalBridge (partialBridge) {
    this.__setState({
      bridge: {
        ...this.state.bridge,
        ...partialBridge
      }
    })
  }

  addElementToLocalBridge (element) {
    this.__resetEditingBridge()
    this.setElementToLocalBridge(element)
  }

  setElementToLocalBridge (element, noMove) {
    const { target } = this.state.editBridge

    switch (target) {
      case EDIT_BRIDGE_TARGET.FROM:
        return this.__setState(
          compose(
            setIn(['bridge', 'from'], element),
            !noMove ? setIn(['editBridge', 'target'], EDIT_BRIDGE_TARGET.TO) : x => x
          )(this.state)
        )

      // Note: Must manually resetLocalBridge, to set 'target' to valid value,
      // Otherwise, after two `addElementToLocalBridge` it just throws error
      case EDIT_BRIDGE_TARGET.TO:
        return this.__setState(
          compose(
            setIn(['bridge', 'to'], element),
            !noMove ? setIn(['editBridge', 'target'], EDIT_BRIDGE_TARGET.FROM) : x => x
          )(this.state)
        )

      default:
        throw new Error(`Invalid target status to addElementToLocalBridge`, target)
    }
  }

  setContentElementToLocalBridge (element, noMove) {

    return this.__setState(
      compose(
        setIn(['element_id'], element.id)
      )(this.state)
    )
    
  }

  setLastAnnotation (annotation) {
    this.__resetEditingBridge()
    this.__setState({ lastAnnotation: annotation })
  }

  startEditBridge (bridge, target) {
    this.__setState({
      bridge,
      editBridge: { target }
    })
  }

  endEditBridge () {
    this.resetLocalBridge()
  }

  __resetEditingBridge () {
    if (this.getLocalBridgeStatus() === LOCAL_BRIDGE_STATUS.EDITING) {
      this.__setState({
        bridge: {
          from: null,
          to: null,
          id: null
        },
        editBridge: {
          target: EDIT_BRIDGE_TARGET.FROM
        }
      })
    }
  }

  __setState (obj = {}) {
    log('localModel: __setState', obj)
    this.state = {...this.state, ...obj}
  }
}

let instance

export function getLinkPair () {
  if (instance) return instance
  instance = new LocalModel()
  return instance
}
