import { reverseKeyValue, pick } from '../utils'
import { TARGET_TYPE } from '../models/local_model'

export const ELEMENT_TYPES = {
  [TARGET_TYPE.IMAGE]:      1,
  [TARGET_TYPE.SELECTION]:  2
}

export const REVERSED_ELEMENT_TYPES = reverseKeyValue(ELEMENT_TYPES)

export const encodeElementType = (type) => {
  const value = ELEMENT_TYPES[type]
  if (!value) throw new Error(`Invalid element type: ${type}`)
  return value
}

export const decodeElementType = (type) => {
  const value = REVERSED_ELEMENT_TYPES[type]
  if (!value) throw new Error(`Invalid element type number: ${type}`)
  return value
}

export const encodeRect = (rect, imageSize) => {
  const list = [rect.x, rect.y, rect.width, rect.height, imageSize.width, imageSize.height]
  return list.join(',')
}

export const decodeRect = (str = '') => {
  const list = str.split(',')
  if (list.length !== 4 && list.length !== 6)  return null

  const [x, y, width, height, imageWidth, imageHeight] = list.map(n => parseFloat(n))
  return {
    rect: { x, y, width, height },
    imageSize: {
      width:  imageWidth,
      height: imageHeight
    }
  }
}

export const encodeElement = (element) => {
  const data = (function () {
    switch (element.type) {
      case TARGET_TYPE.IMAGE: {
        return {
          ...pick(['url', 'image'], element),
          start_locator:  element.locator,
          rect:           encodeRect(element.rect, element.imageSize)
        }
      }

      case TARGET_TYPE.SELECTION: {
        return {
          ...pick(['url', 'image', 'text'], element),
          start_locator:  element.start.locator,
          start_offset:   element.start.offset,
          end_locator:    element.end.locator,
          end_offset:     element.end.offset
        }
      }

      default:
        throw new Error(`encodeElement: Unsupported element type, '${element.type}'`)
    }
  })()

  return {
    ...data,
    id:   element.id,
    type: encodeElementType(element.type)
  }
}

export const decodeElement = (element) => {
  const type = decodeElementType(element.type)

  const data = (function () {
    switch (type) {
      case TARGET_TYPE.IMAGE: {
        return {
          ...pick(['url', 'image'], element),
          locator:  element.start_locator,
          ...decodeRect(element.rect)
        }
      }

      case TARGET_TYPE.SELECTION: {
        return {
          ...pick(['url', 'image', 'text'], element),
          start: {
            locator: element.start_locator,
            offset:  element.start_offset
          },
          end: {
            locator: element.end_locator,
            offset:  element.end_offset
          }
        }
      }

      default:
        throw new Error(`decodeElement: Unsupported element type, '${element.type}'`)
    }
  })()

  return { ...data, type, id: element.id }
}
