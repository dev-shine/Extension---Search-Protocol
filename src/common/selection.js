import { xpath, getElementsByXPath } from './dom_utils'

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
