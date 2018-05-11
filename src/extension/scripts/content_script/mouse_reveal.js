import throttle from 'lodash.throttle'
import { uid } from '../../../common/utils'
import { scrollLeft, scrollTop, clientWidth, clientHeight } from '../../../common/dom_utils'
import { POSITION_TYPE } from './position'

const TROTTLE_INTERVAL = 200

export class MouseReveal {
  constructor ({ items, distance, duration = 2, doc = document }) {
    this.distance     = distance
    this.doc          = doc
    this.candidates   = []
    this.disabled     = false
    this.duration     = duration
    this.items        = items.map(item => this.createItemController(item, uid()))

    this.init()
  }

  onScroll = throttle(() => {
    if (this.disabled)  return
    this.updateCandidates()
    this.updateCandidatesVisiblitiy()
  }, TROTTLE_INTERVAL)

  onMouseMove = throttle((e) => {
    this.mousePosition = {
      x: e.pageX,
      y: e.pageY
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
    let lastPosition      = POSITION_TYPE.FAR
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
        if (lastPosition !== POSITION_TYPE.FAR) return

        clearTimeout(timer)
        item.show()
        timer = setTimeout(() => item.hide(), this.duration)
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
        lastPosition      = POSITION_TYPE.FAR
        lastMoveTimeStamp = 0
      },
      updateVisibility: (point) => {
        const pos = api.pointPosition(point, this.distance)

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

        lastPosition      = pos
        lastMoveTimeStamp = new Date() * 1
      }
    }

    return api
  }

  updateCandidates () {
    const newOnes = this.items.filter(item => item.isInView())
    const removed = this.candidates.filter(item => newOnes.indexOf(item) === -1)

    removed.forEach(item => item.reset())
    this.candidates = newOnes
  }

  updateCandidatesVisiblitiy () {
    this.candidates.forEach(item => item.updateVisibility(this.mousePosition))
  }

  disable () {
    this.disabled = true
    this.candidates.forEach(item => item.reset())
  }

  enable () {
    this.disabled = false
  }

  destroy () {
    const doc = this.doc

    doc.removeEventListener('scroll', this.onScroll, true)
    doc.removeEventListener('mousemove', this.onMouseMove, true)
  }
}
