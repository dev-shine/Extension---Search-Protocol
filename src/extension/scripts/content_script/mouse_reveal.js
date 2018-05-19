import throttle from 'lodash.throttle'
import log from '../../../common/log'
import { uid, noop } from '../../../common/utils'
import { scrollLeft, scrollTop, clientWidth, clientHeight, pageX, pageY } from '../../../common/dom_utils'
import { POSITION_TYPE } from './position'

const TROTTLE_INTERVAL = 200

export class MouseReveal {
  constructor ({ items, distance, duration = 2, doc = document, onDestroy = noop }) {
    this.distance     = distance
    this.doc          = doc
    this.candidates   = []
    this.disabled     = false
    this.duration     = duration
    this.items        = items.map(item => this.createItemController(item, uid()))
    this.onDestroy    = onDestroy

    this.init()
  }

  onScroll = throttle(() => {
    if (this.disabled)  return
    this.updateCandidates()
    this.updateCandidatesVisiblitiy()
  }, TROTTLE_INTERVAL)

  onMouseMove = throttle((e) => {
    this.mousePosition = {
      x: e.clientX,
      y: e.clientY
    }

    if (this.disabled)  return
    this.updateCandidatesVisiblitiy()
  }, TROTTLE_INTERVAL)

  init () {
    const doc = this.doc

    this.updateCandidates()
    doc.addEventListener('scroll', this.onScroll, true)
    doc.addEventListener('mousemove', this.onMouseMove, true)
  }

  createItemController (item, id) {
    let timer
    let lastNonNearPosition = POSITION_TYPE.FAR
    let lastMoveTimeStamp = 0

    const api = {
      getId: () => {
        return id
      },
      show: () => {
        clearTimeout(timer)
        item.show()
      },
      hide: () => {
        clearTimeout(timer)
        item.hide()
      },
      showAndFade: () => {
        if (lastNonNearPosition !== POSITION_TYPE.FAR) return

        clearTimeout(timer)
        item.show()
        timer = setTimeout(() => item.hide(), this.duration * 1000)
      },
      isInView: () => {
        return item.isInView()
      },
      pointPosition: (point, distance) => {
        return item.pointPosition(point, distance)
      },
      reset: () => {
        api.hide()
        clearTimeout(timer)
        lastNonNearPosition = POSITION_TYPE.FAR
        lastMoveTimeStamp = 0
      },
      updateVisibility: (point) => {
        const pos = api.pointPosition(point, this.distance)
        // log('updateVisibility', point, pos)

        switch (pos) {
          case POSITION_TYPE.FAR:
            api.hide()
            break

          case POSITION_TYPE.HOVER:
            api.show()
            break

          case POSITION_TYPE.NEAR:
            api.showAndFade()
            break
        }

        if (pos !== POSITION_TYPE.NEAR) {
          lastNonNearPosition = pos
        }

        lastMoveTimeStamp = new Date() * 1
      }
    }

    return api
  }

  updateCandidates () {
    const newOnes = this.items.filter(item => item.isInView())
    const removed = this.candidates.filter(item => newOnes.indexOf(item) === -1)

    // log('updateCandidates, removed, newOnes', removed, newOnes)
    removed.forEach(item => item.reset())
    this.candidates = newOnes
  }

  updateCandidatesVisiblitiy () {
    this.candidates.forEach(item => item.updateVisibility({
      x: pageX(this.mousePosition.x),
      y: pageY(this.mousePosition.y)
    }))
  }

  disable () {
    this.disabled = true
    this.candidates.forEach(item => item.reset())
  }

  enable () {
    this.disabled = false
  }

  setDistance (distance) {
    this.distance = distance
  }

  setDuration (duration) {
    this.duration = duration
  }

  destroy () {
    const doc = this.doc

    doc.removeEventListener('scroll', this.onScroll, true)
    doc.removeEventListener('mousemove', this.onMouseMove, true)

    this.onDestroy()
  }
}
