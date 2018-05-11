import log from '../../../common/log'

export const POSITION_TYPE = {
  FAR:    'FAR',
  NEAR:   'NEAR',
  HOVER:  'HOVER'
}

export const nearer = (p1, p2) => {
  switch (p1) {
    case POSITION_TYPE.FAR:   return p2
    case POSITION_TYPE.NEAR:  return (p2 === POSITION_TYPE.FAR) ? p1 : p2
    case POSITION_TYPE.HOVER: return p1
  }
}

export const pointInRect = ({ rect, point }) => {
  return (point.x > rect.left && point.y > rect.top &&
          point.x < rect.left + rect.width &&
          point.y < rect.top + rect.height)
}

export const rectPointPosition = ({ rect, point, nearDistance }) => {
  // log('rectPointPosition', rect, point, nearDistance)
  if (pointInRect({ rect, point })) return POSITION_TYPE.HOVER

  const outerRect = {
    left:   rect.left - nearDistance,
    top:    rect.top - nearDistance,
    width:  rect.width + 2 * nearDistance,
    height: rect.height + 2 * nearDistance
  }

  return pointInRect({ rect: outerRect, point }) ? POSITION_TYPE.NEAR : POSITION_TYPE.FAR
}

export const rectsPointPosition = ({ rects, point, nearDistance }) => {
  const positions = rects.map(rect => rectPointPosition({ rect, point, nearDistance }))

  return positions.reduce((prev, cur) => {
    if (prev === POSITION_TYPE.HOVER) return prev
    return nearer(prev, cur)
  }, POSITION_TYPE.FAR)
}
