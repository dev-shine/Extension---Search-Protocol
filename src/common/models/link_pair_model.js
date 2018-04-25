
const LINK_PAIR_STATUS = {
  EMPTY:    'EMPTY',
  ONE:      'ONE',
  READY:    'READY',
  TOO_MANY: 'TOO_MANY'
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

  return {
    url:     data[p('url')],
    desc:    data[p('des')],
    tags:    data[p('tags')],
    image:   data[p('image')],
    rect:    offset2rect(JSON.parse(data[p('offset')]))
  }
}

export function encodeLink (prefix, data) {
  const p = str => prefix + str

  return {
    [p('url')]:     data.url,
    [p('des')]:     data.desc,
    [p('tags')]:    data.tags,
    [p('image')]:   data.image,
    [p('offset')]:  JSON.stringify(rect2offset(data.rect))
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

export class LinkPairModel {
  constructor () {
    this.__resetPair()
  }

  __resetPair () {
    this.pair = {
      links: [],
      desc: null,
      tags: null,
      relationship: null
    }
  }

  addLink (link) {
    this.pair.links.push(link)
  }

  clear () {
    this.__resetPair()
  }

  get () {
    return this.pair
  }

  getStatus () {
    switch (this.pair.links.length) {
      case 0:   return LINK_PAIR_STATUS.EMPTY
      case 1:   return LINK_PAIR_STATUS.ONE
      case 2:   return LINK_PAIR_STATUS.READY
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
