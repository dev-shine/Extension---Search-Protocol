import { ElementModel, backend as elementBackend } from '../models/element_model'
import { AnnotationModel, backend as annotationBackend } from '../models/annotation_model'
import { BridgeModel, backend as bridgeBackend } from '../models/bridge_model'
import { createModelData } from '../models/base_model'

export const createContentElement = (data) => {
  const el = new ElementModel({ local: data })
  return el.sync()
}

export const createAnnotation = ({ target, ...data }) => {
  const annotation = new AnnotationModel({
    local: {
      ...data,
      target: createModelData(target)
    }
  })
  return annotation.sync()
}

export const createBridge = ({ from, to, ...data }) => {
  const bridge = new BridgeModel({
    local: {
      ...data,
      from: createModelData(from),
      to:   createModelData(to)
    }
  })
  return bridge.sync()
}

export const updateBridge = (id, { from, to, ...data }) => {
  const bridge = new BridgeModel({
    data: {
      ...data,
      from: createModelData(from),
      to:   createModelData(to)
    }
  })
  return bridge.push()
}

export const clearAllData = () => {
  return Promise.all([
    elementBackend.clear(),
    annotationBackend.clear(),
    bridgeBackend.clear()
  ])
  .then(() => true)
}
