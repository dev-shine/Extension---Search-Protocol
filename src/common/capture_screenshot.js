import Ext from 'ext'
import { delay } from './utils'

// refer to https://stackoverflow.com/questions/12168909/blob-from-dataurl
export function dataURItoBlob (dataURI) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);

  // create a view into the buffer
  var ia = new Uint8Array(ab);

  // set the bytes of the buffer to the correct values
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  var blob = new Blob([ab], {type: mimeString});
  return blob;
}

function getActiveTabInfo () {
  return Ext.windows.getLastFocused()
  .then(win => {
    return Ext.tabs.query({ active: true, windowId: win.id })
    .then(tabs => tabs[0])
  })
}

function pCompose (list) {
  return list.reduce((prev, fn) => {
    return prev.then(fn)
  }, Promise.resolve())
}

function getAllScrollOffsetsForRect (
  { x, y, width, height },
  { pageWidth, pageHeight, windowWidth, windowHeight, originalX, originalY, topPadding = 150 }
) {
  const topPad  = windowHeight > topPadding ? topPadding : 0
  const xStep   = windowWidth
  const yStep   = windowHeight - topPad
  const result  = []

  for (let sy = y + height - windowHeight; sy > y - yStep; sy -= yStep) {
    for (let sx = x; sx < x + width; sx += xStep) {
      result.push({ x: sx, y: sy })
    }
  }

  if (result.length === 0) {
    result.push({ x: originalX, y: originalY })
  }

  return result
}

function createCanvas (width, height, pixelRatio = 1) {
  const canvas = document.createElement('canvas')
  canvas.width  = width * pixelRatio
  canvas.height = height * pixelRatio
  return canvas
}

function drawOnCanvas ({ canvas, dataURI, x, y, width, height }) {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => {
      canvas.getContext('2d').drawImage(image, 0, 0, image.width, image.height, x, y, width, height)
      resolve({
        x,
        y,
        width,
        height
      })
    }

    image.src = dataURI
  })
}

function commpatibleDevicePixelRatio (ratio) {
  return ratio
}

function withPageInfo (startCapture, endCapture, callback) {
  return startCapture()
  .then(pageInfo => {
    // Note: in case sender contains any non-serializable data
    delete pageInfo.sender

    return callback(pageInfo)
    .then(result => {
      endCapture(pageInfo)
      return result
    })
  })
}

export function captureScreen ({ startCapture, endCapture }, options = {}) {
  const opts = {
    blob: false,
    ...options
  }
  const convert = opts.blob ? dataURItoBlob : x => x

  return withPageInfo(startCapture, endCapture, pageInfo => {
    const ratio   = commpatibleDevicePixelRatio(pageInfo.devicePixelRatio)

    return Ext.tabs.captureVisibleTab(null, { format: 'png' })
    .then(dataURI => {
      const canvas = createCanvas(pageInfo.windowWidth, pageInfo.windowHeight, ratio)

      return drawOnCanvas({
        canvas,
        dataURI,
        x:      0,
        y:      0,
        width:  pageInfo.windowWidth * ratio,
        height: pageInfo.windowHeight * ratio
      })
      .then(() => convert(canvas.toDataURL()))
    })
  })
}

export function captureScreenInSelection ({ rect, devicePixelRatio }, { startCapture, scrollPage, endCapture }, options = {}) {
  const opts = {
    blob: false,
    ...options
  }
  const convert = opts.blob ? dataURItoBlob : x => x
  const ratio   = commpatibleDevicePixelRatio(devicePixelRatio)

  return withPageInfo(startCapture, endCapture, pageInfo => {
    const maxSide       = Math.floor(32767 / ratio)
    pageInfo.pageWidth  = Math.min(maxSide, pageInfo.pageWidth)
    pageInfo.pageHeight = Math.min(maxSide, pageInfo.pageHeight)

    const canvas        = createCanvas(rect.width, rect.height, ratio)
    const scrollOffsets = getAllScrollOffsetsForRect(rect, pageInfo)
    const todos         = scrollOffsets.map((offset, i) => () => {
      return scrollPage(offset, { index: i, total: scrollOffsets.length })
      .then(realOffset => {
        return Ext.tabs.captureVisibleTab(null, { format: 'png' })
        .then(dataURI => drawOnCanvas({
          canvas,
          dataURI,
          x:      (realOffset.x - rect.x) * devicePixelRatio,
          y:      (realOffset.y - rect.y) * devicePixelRatio,
          width:  pageInfo.windowWidth * devicePixelRatio,
          height: pageInfo.windowHeight * devicePixelRatio
        }))
      })
    })

    return pCompose(todos)
    .then(() => convert(canvas.toDataURL()))
  })
}

export const captureClientAPI = {
  startCapture: () => {
    const body = document.body
    const widths = [
      document.documentElement.clientWidth,
      document.documentElement.scrollWidth,
      document.documentElement.offsetWidth,
      body ? body.scrollWidth : 0,
      body ? body.offsetWidth : 0
    ]
    const heights = [
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight,
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0
    ]

    const data = {
      pageWidth:    Math.max(...widths),
      pageHeight:   Math.max(...heights),
      windowWidth:  window.innerWidth,
      windowHeight: window.innerHeight,
      hasBody:      !!body,
      originalX:    window.scrollX,
      originalY:    window.scrollY,
      originalOverflowStyle: document.documentElement.style.overflow,
      originalBodyOverflowYStyle: body && body.style.overflowY,
      devicePixelRatio: window.devicePixelRatio
    }

    // Note: try to make pages with bad scrolling work, e.g., ones with
    // `body { overflow-y: scroll; }` can break `window.scrollTo`
    if (body) {
      body.style.overflowY = 'visible'
    }

    // Disable all scrollbars. We'll restore the scrollbar state when we're done
    // taking the screenshots.
    document.documentElement.style.overflow = 'hidden'

    return Promise.resolve(data)
  },
  scrollPage: ({ x, y }) => {
    window.scrollTo(x, y)

    return delay(() => ({
      x: window.scrollX,
      y: window.scrollY
    }), 100)
  },
  endCapture: (pageInfo) => {
    const {
      originalX, originalY, hasBody,
      originalOverflowStyle,
      originalBodyOverflowYStyle
    } = pageInfo

    if (hasBody) {
      document.body.style.overflowY = originalBodyOverflowYStyle
    }

    document.documentElement.style.overflow = originalOverflowStyle
    window.scrollTo(originalX, originalY)

    return Promise.resolve(true)
  }
}
