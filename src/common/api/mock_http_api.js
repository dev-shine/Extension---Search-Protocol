import storage from '../storage'
import { or, uid } from '../utils'
import { ElementModel, backend as elementBackend } from '../models/element_model'
import { AnnotationModel, backend as annotationBackend } from '../models/annotation_model'
import { BridgeModel, backend as bridgeBackend } from '../models/bridge_model'

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

const getKey = (element) => typeof element === 'string' ? 'id' : 'local'

export const createAnnotation = ({ target, ...data }) => {
  const key = getKey(target)
  const el  = new ElementModel({ [key]: target })

  return el.sync()
  .then(element => {
    const annotation = new AnnotationModel({
      local: {
        ...data,
        target: element.id
      }
    })

    return annotation.sync()
  })
}

export const createBridge = ({ from, to, ...data }) => {
  const elFrom  = new ElementModel({ [getKey(from)]:  from })
  const elTo    = new ElementModel({ [getKey(to)]:    to })

  return Promise.all([elFrom.sync(), elTo.sync()])
  .then(tuple => {
    const bridge = new BridgeModel({
      local: {
        ...data,
        from: tuple[0].id,
        to:   tuple[1].id
      }
    })
  })
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
