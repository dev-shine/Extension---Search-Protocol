
export const encodeRelation = (relation) => 1

export const decodeRelation = (relation) => 'models'

export const encodeBridge = (bridge) => {
  return {
    ...bridge,
    relation: encodeRelation(bridge.relation)
  }
}

export const decodeBridge = (bridge) => {
  return {
    ...bridge,
    relation: decodeRelation(bridge.relation)
  }
}
