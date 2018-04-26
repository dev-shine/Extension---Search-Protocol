import { xpath, getElementsByXPath, scrollLeft, scrollTop } from './dom_utils'
import { or, and } from './utils'

export const createRange = () => new Range()

export const rangeToJSON = (range) => {
  const r = range

  return {
    start: {
      xpath:  xpath(r.startContainer),
      offset: r.startOffset
    },
    end: {
      xpath:  xpath(r.endContainer),
      offset: r.endOffset
    }
  }
}

export const parseRangeJSON = (rangeJson) => {
  const r = createRange()

  const $start  = getElementsByXPath(rangeJson.start.xpath)
  if (!$start) throw new Error('Not able to find start element for range')

  const $end    = getElementsByXPath(rangeJson.end.xpath)
  if (!$start) throw new Error('Not able to find end element for range')

  r.setStart($start, rangeJson.start.offset)
  r.setEnd($end, rangeJson.end.offset)

  return r
}

export const isPointInRect = (point, rect) => {
  return (
    point.x > rect.x &&
    point.y > rect.y &&
    point.x < (rect.x + rect.width) &&
    point.y < (rect.y + rect.height)
  )
}

export const isPointInRange = (point, range) => {
  const rects = Array.from(range.getClientRects())
  const sx    = scrollLeft(document)
  const sy    = scrollTop(document)
  const isIn  = (point, rect) => {
    return isPointInRect(point, {
      x:        rect.left + sx,
      y:        rect.top + sy,
      width:    rect.width,
      height:   rect.height
    })
  }

  console.log(point, rects)

  return or(...rects.map(rect => isIn(point, rect)))
}
