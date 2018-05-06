import storage from '../storage'
import { or, uid } from '../utils'
import { ElementModel, backend as elementBackend } from '../models/element_model'
import { AnnotationModel, backend as annotationBackend } from '../models/annotation_model'
import { BridgeModel, backend as bridgeBackend } from '../models/bridge_model'
import { createModelData } from '../models/base_model'

export const loadLinks = ({ url }) => {
  return storage.get('bridgit_links')
  .then((pairs = []) => {
    return pairs.filter(p => {
      return or(...p.links.map(l => l.url === url))
    })
  })
}

export const postLinks = (linkPair) => {
  return storage.get('bridgit_links')
  .then((pairs = []) => {
    return storage.set(
      'bridgit_links',
      [...pairs, { ...linkPair, id: uid() }]
    )
  })
}

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

export const annotationsAndBridgesByUrl = (url) => {
  return elementBackend.list({ url })
  .then(elements => {
    const ids = elements.map(el => el.id)

    return Promise.all([
      annotationBackend.list({ target: ids }),
      bridgeBackend.listWithElementId({ eid: ids })
    ])
    .then(tuple => {
      return {
        elements,
        bridges:      tuple[1],
        annotations:  tuple[0]
      }
    })
  })
}

export const loadElementsByIds = (ids) => {
  return elementBackend.list()
  .then(elements => {
    return elements.filter(el => ids.indexOf(el.id) !== -1)
  })
}
