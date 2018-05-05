import { and } from '../utils'

export const LINK_PAIR_STATUS = {
  EMPTY:    'EMPTY',
  ONE:      'ONE',
  TWO:      'TWO',
  READY:    'READY',
  TOO_MANY: 'TOO_MANY'
}

export const TARGET_TYPE = {
  SCREENSHOT: 'SCREENSHOT',
  IMAGE:      'IMAGE',
  SELECTION:  'SELECTION'
}

export function offset2rect (offset) {
  return {
    x:      offset.left,
    y:      offset.top,
    width:  offset.width,
    height: offset.height
  }
}

export function rect2offset (rect) {
  return {
    left:   rect.x,
    top:    rect.y,
    width:  rect.width,
    height: rect.height
  }
}

export function decodeLink (prefix, data) {
  const p = str => prefix + str
  const ensureObj = (s) => typeof s === 'string' ? JSON.parse(s) : s
  const type = data[p('url')]

  return {
    // Basic Info
    type:     type,
    url:      data[p('url')],
    // Annotation Info
    title:    data[p('title')],
    desc:     data[p('des')],
    tags:     data[p('tags')],
    // Type Specific Info
    ...(function () {
      switch (type) {
        case 'SCREENSHOT':
          return {
            image:  data[p('image')],
            rect:   offset2rect(ensureObj(data[p('offset')]))
          }
        case 'IMAGE':
          return {
            locator:  data[p('locator')],
            image:    data[p('image')],
            rect:     offset2rect(ensureObj(data[p('offset')]))
          }
        case 'SELECTION':
          return {
            start: {
              locator:  data[p('start_locator')],
              offset:   data[p('start_offset')]
            },
            end: {
              locator:  data[p('end_locator')],
              offset:   data[p('end_offset')]
            },
            text:  data[p('tex')]
          }
      }
    })()
  }
}

export function encodeLink (prefix, data) {
  const p = str => prefix + str

  return {
    // Basic Info
    [p('type')]:    data.type,
    [p('url')]:     data.url,
    // Annotation Info
    [p('title')]:   data.title,
    [p('des')]:     data.desc,
    [p('tags')]:    data.tags,
    // Type Specific Info
    ...(function () {
      switch (data.type) {
        case 'SCREENSHOT':
          return {
            [p('image')]:   '', // Note: return empty for now // data.image,
            [p('offset')]:  JSON.stringify(rect2offset(data.rect))
          }
        case 'IMAGE':
          return {
            [p('locator')]: data.locator,
            [p('image')]:   '', // Note: return empty for now // data.image,
            [p('offset')]:  JSON.stringify(rect2offset(data.rect))
          }
        case 'SELECTION':
          return {
            [p('start_locator')]: data.start.locator,
            [p('start_offset')]:  data.start.offset,
            [p('end_locator')]:   data.end.locator,
            [p('end_offset')]:    data.end.offset,
            [p('text')]:          data.text
          }
      }
    })()

  }
}

export function decodePair (data) {
  return {
    id:           data.c_id,
    desc:         data.c_des,
    tags:         data.c_tags,
    relation:     data.c_relation,
    links:        [
      decodeLink('link1_', data),
      decodeLink('link2_', data)
    ]
  }
}

export function encodePair (data) {
  return {
    c_id:       data.id,
    c_des:      data.desc,
    c_tags:     data.tags,
    c_relation: data.relation,
    ...encodeLink('link1_', data.links[0]),
    ...encodeLink('link2_', data.links[1])
  }
}

export function isLinkReady (link) {
  const common = link.url && link.title && link.desc && link.tags

  switch (link.type) {
    case TARGET_TYPE.IMAGE:
      return !!(common /* && link.image  */ && link.rect && link.locator)

    case TARGET_TYPE.SELECTION:
      return !!(common && link.start && link.end && link.text)

    case TARGET_TYPE.SCREENSHOT:
      return !!(common /* && link.image  */  && link.rect)

    default:
      throw new Error(`invalid type: '${link.type}'`)
  }
}

export function isLinkEqual (a, b) {
  if (a.type !== b.type)  return false

  const isEqual       = (x, y) => JSON.stringify(x) === JSON.stringify(y)
  const commonKeys    = ['url', 'title', 'desc', 'tags']
  const keysToCompare = {
    [TARGET_TYPE.SCREENSHOT]: [...commonKeys, 'image', 'offset'],
    [TARGET_TYPE.IMAGE]:      [...commonKeys, 'image', 'offset', 'locator'],
    [TARGET_TYPE.SELECTION]:  [...commonKeys, 'start', 'end', 'text']
  }

  return and(
    ...keysToCompare[a.type].map(key => isEqual(a[key], b[key]))
  )
}

export class LinkPairModel {
  constructor () {
    this.__resetPair()
  }

  __resetPair () {
    this.pair = {
      links: [],
      desc: null,
      tags: null,
      relation: null
    }
  }

  addLink (link) {
    this.pair.links.push(link)
    console.log('addLink', this.pair)
  }

  clear () {
    this.__resetPair()
  }

  get () {
    return this.pair
  }

  set (data) {
    this.pair = data
  }

  getStatus () {
    switch (this.pair.links.length) {
      case 0:   return LINK_PAIR_STATUS.EMPTY
      case 1:   return LINK_PAIR_STATUS.ONE
      case 2:   {
        if (isLinkReady(this.pair.links[0]) && isLinkReady(this.pair.links[1])) {
          return LINK_PAIR_STATUS.READY
        } else {
          return LINK_PAIR_STATUS.TWO
        }
      }
      default:  return LINK_PAIR_STATUS.TOO_MANY
    }
  }
}

let instance

export function getLinkPair () {
  if (instance) return instance
  instance = new LinkPairModel()
  return instance
}
