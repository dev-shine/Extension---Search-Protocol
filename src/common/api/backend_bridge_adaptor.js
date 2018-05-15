
export const encodeRelation = (relation) => relation

export const decodeRelation = (relation) => relation

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
