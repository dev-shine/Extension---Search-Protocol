import { xpath, getElementByXPath, scrollLeft, scrollTop } from './dom_utils'
import { or, and } from './utils'

export const createRange = () => new Range()

export const rangeToJSON = (range) => {
  const r = range

  return {
    start: {
      locator:  xpath(r.startContainer),
      offset:   r.startOffset
    },
    end: {
      locator:  xpath(r.endContainer),
      offset:   r.endOffset
    }
  }
}

export const parseRangeJSON = (rangeJson) => {
  const r = createRange()

  const $start  = getElementByXPath(rangeJson.start.locator)
  if (!$start) throw new Error('Not able to find start element for range')

  const $end    = getElementByXPath(rangeJson.end.locator)
  if (!$start) throw new Error('Not able to find end element for range')

  r.setStart($start, rangeJson.start.offset)
  r.setEnd($end, rangeJson.end.offset)

  return r
}

export const isPointInRect = (point, rect) => {
  
  // return (
    // point.x > rect.x &&
    // point.y > rect.y &&
    // point.x < (rect.x + rect.width * 1.25) &&
    // point.y < (rect.y + rect.height)
  // )
  return true
}

export const isPointInRange = (point, range) => {
  // const rects = Array.from(range.getClientRects())
  const rects = [range.getBoundingClientRect()]
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

  return or(...rects.map(rect => isIn(point, rect)))
}


function getMaxImage() {
  var maxDimension = 0;
  var maxImage = null;

  // Iterate through all the images.
  var imgElements = document.getElementsByTagName('img');
  for (var index in imgElements) {
    var img = imgElements[index];
    var currDimension = img.width * img.height;
    if (currDimension  > maxDimension){
       maxDimension = currDimension
       maxImage = img;
    }
  }
  
  // Check if an image has been found.
  if (maxImage) 
    return maxImage;
  else
    return null;
}

export const storeImageOrContent = (selection) => {
  const $img = getMaxImage();
  
  if (!$img || ($img.height < 300 || $img.width < 300) ) return {image_path: ""}
  
  let img_url = $img.src || $img.dataset.src;

  // console.log("==============================");
  // console.log($img.getBoundingClientRect());
  // console.log("==============================");

  return {
    'image_path': img_url && (img_url.includes("http:") || img_url.includes("https:")) ? img_url : ""
  }
}


export const selectionToJSON = (selection) => {
  return {
    ...rangeToJSON(selection.getRangeAt(0)),
    text: selection.toString()
  }
}
