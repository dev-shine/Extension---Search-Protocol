import * as C from '../../../common/constant'
import log from '../../../common/log'
import API from 'cs_api'
import Ext from 'ext'
import { parseRangeJSON } from '../../../common/selection'
import { ELEMENT_TYPE } from '../../../common/models/element_model'
import { liveBuild, isRectsIntersect, or } from '../../../common/utils'
import {
  setStyle, scrollLeft, scrollTop, clientWidth, clientHeight,
  pixel, pageX, pageY, getElementByXPath
} from '../../../common/dom_utils'
import {
  commonStyle,
  createEl,
  createIframeWithMask,
  createOverlayForRects
} from './common'
import { rectsPointPosition } from './position'

export const showLinks = ({ elements, bridges, annotations, url, onCreate, getCsAPI }) => {
  const links = elements.map(item => {
    return {
      ...item,
      bridges:      bridges.filter(a => a.from === item.id || a.to === item.id),
      annotations:  annotations.filter(b => b.target === item.id)
    }
  })
  .filter(item => item.bridges.length + item.annotations.length > 0)

  const allLinks  = links.map(link => showOneLink({
    link,
    onCreate,
    getCsAPI,
    getLinksAPI:  () => linksAPI
  }))
  .filter(x => x)

  const linksAPI = {
    links: allLinks,
    hide: () => {
      allLinks.forEach(item => item.hide())
    },
    destroy: () => {
      allLinks.forEach(item => item.destroy())
    }
  }

  return linksAPI
}

export const showOneLink = ({ link, getLinksAPI, getCsAPI, color, opacity, needBadge = true, onCreate = () => {} }) => {
  log('showOneLink', link.type, link)

  switch (link.type) {
    case ELEMENT_TYPE.IMAGE:
      return showImage({ link, getLinksAPI, getCsAPI, color, opacity, needBadge, onCreate })

    case ELEMENT_TYPE.SELECTION:
      return showSelection({ link, getLinksAPI, getCsAPI, color, opacity, needBadge, onCreate })

    default:
      throw new Error(`Unsupported type '${link.type}'`)
  }
}

const commonShowAPI = ({ rects }) => {
  const normalizedRects = rects.map(r => ({
    left:   pageX(r.left),
    top:    pageY(r.top),
    width:  r.width,
    height: r.height
  }))

  return {
    isInView: () => {
      const winRect = {
        left:     scrollLeft(document),
        top:      scrollTop(document),
        width:    clientWidth(document),
        height:   clientHeight(document)
      }
      const result = or(
        ...normalizedRects.map(rect => isRectsIntersect(winRect, rect))
      )

      // log('isInView', normalizedRects, winRect, result)
      return result
    },
    pointPosition: (point, distance) => {
      return rectsPointPosition({
        point,
        rects: normalizedRects,
        nearDistance: distance
      })
    }
  }
}

export const showHyperLinkBadge = ({ totalCount, url, $el }) => {
  let timer

  const liveBuildAPI = liveBuild({
    bindEvent: (fn) => {
      window.addEventListener('resize', fn)
      window.addEventListener('scroll', fn)
      timer = setInterval(fn, 2000)
    },
    unbindEvent: (fn) => {
      window.removeEventListener('resize', fn)
      window.removeEventListener('scroll', fn)
      clearInterval(timer)
    },
    getFuse: () => {
      const rect = $el.getBoundingClientRect()
      return rect
    },
    isEqual: (r1, r2) => {
      const encode = (r) => JSON.stringify(r)
      return encode(r1) === encode(r2)
    },
    onFuseChange: (rect, oldAPI) => {
      if (oldAPI) oldAPI.destroy()

      const topRight  = {
        top:  pixel(pageY(rect.top)),
        left: pixel(pageX(rect.left + rect.width))
      }
      const badgeAPI  = showBridgeCount({
        text:     totalCount,
        position: topRight,
        style: {
          background: '#ef5d8f',
          color:      '#fff'
        },
        onClick:  () => { window.location.href = url }
      })

      const api = {
        getBadgeContainer: () => {
          return badgeAPI.$dom
        },
        show: () => {
          badgeAPI.show()
        },
        hide: () => {
          badgeAPI.hide()
        },
        destroy: () => {
          badgeAPI.destroy()
        }
      }

      return api
    }
  })

  const api = ['getOverlayContainer', 'getBadgeContainer', 'getElement', 'show', 'hide', 'isInView', 'pointPosition'].reduce((prev, key) => {
    prev[key] = (...args) => {
      if (!liveBuildAPI)  return
      return liveBuildAPI.getAPI()[key](...args)
    }
    return prev
  }, {})

  api.destroy = () => {
    liveBuildAPI.getAPI().destroy()
    liveBuildAPI.destroy()
  }

  return api
}

export const showImage = ({ link, getLinksAPI, getCsAPI, color, opacity, needBadge, onCreate }) => {
  const { bridges = [], annotations = [] } = link
  const totalCount  = bridges.length + annotations.length
  let timer

  const liveBuildAPI = liveBuild({
    initial: true,
    bindEvent: (fn) => {
      window.addEventListener('resize', fn)
      window.addEventListener('scroll', fn)
      timer = setInterval(fn, 2000)
    },
    unbindEvent: (fn) => {
      window.removeEventListener('resize', fn)
      window.removeEventListener('scroll', fn)
      clearInterval(timer)
    },
    getFuse: () => {
      try {
        const $img        = getElementByXPath(link.locator)
        const boundRect   = $img.getBoundingClientRect()
        const ratio       = link.imageSize && link.imageSize.width ? (boundRect.width / link.imageSize.width) : 1
        const rect        = {
          top:      ratio * link.rect.y + boundRect.top,
          left:     ratio * link.rect.x + boundRect.left,
          width:    ratio * link.rect.width,
          height:   ratio * link.rect.height
        }
        return rect
      } catch (e) {
        return null
      }
    },
    isEqual: (r1, r2) => {
      const encode = (r) => JSON.stringify(r)
      return encode(r1) === encode(r2)
    },
    onFuseChange: (rect, oldAPI) => {
      if (!rect)  return null
      if (oldAPI) oldAPI.destroy()

      const topRight    = {
        top:  pixel(pageY(rect.top)),
        left: pixel(pageX(rect.left + rect.width))
      }
      const overlayAPI  = createOverlayForRects({ color, opacity, rects: [rect] })
      const badgeAPI    = needBadge ? showBridgeCount({
        text:     '' + totalCount,
        position: topRight,
        onClick:  () => showBridgesModal({ getCsAPI, bridges, annotations, elementId: link.id })
      }) : {
        show: () => {},
        hide: () => {},
        destroy: () => {}
      }

      const api = {
        ...commonShowAPI({ rects: [rect] }),
        getOverlayContainer: () => {
          return overlayAPI.$container
        },
        getBadgeContainer: () => {
          return badgeAPI.$dom
        },
        getElement: () => {
          return link
        },
        show: () => {
          overlayAPI.show()
          badgeAPI.show()
        },
        hide: () => {
          overlayAPI.hide()
          badgeAPI.hide()
        },
        destroy: () => {
          overlayAPI.destroy()
          badgeAPI.destroy()
        }
      }

      onCreate(api)
      return api
    }
  })

  const api = ['getOverlayContainer', 'getBadgeContainer', 'getElement', 'show', 'hide', 'isInView', 'pointPosition'].reduce((prev, key) => {
    prev[key] = (...args) => {
      if (!liveBuildAPI)  return
      return liveBuildAPI.getAPI()[key](...args)
    }
    return prev
  }, {})

  api.destroy = () => {
    liveBuildAPI.getAPI().destroy()
    liveBuildAPI.destroy()
  }

  return api
}

export const showSelection = ({ link, getLinksAPI, getCsAPI, color, opacity, needBadge, onCreate }) => {
  const { bridges = [], annotations = [] } = link
  const totalCount  = bridges.length + annotations.length
  let timer

  const liveBuildAPI = liveBuild({
    initial: true,
    bindEvent: (fn) => {
      window.addEventListener('resize', fn)
      window.addEventListener('scroll', fn)
      timer = setInterval(fn, 2000)
    },
    unbindEvent: (fn) => {
      window.removeEventListener('resize', fn)
      window.removeEventListener('scroll', fn)
      clearInterval(timer)
    },
    getFuse: () => {
      try {
        const range   = parseRangeJSON(link)
        log('showSelection - getFuse', range, range.getClientRects(), range.getBoundingClientRect())
        const rects   = range.getClientRects()
        return Array.from(rects)
      } catch (e) {
        return null
      }
    },
    isEqual: (rs1, rs2) => {
      const encode = (rs) => JSON.stringify(rs.map(r => r.toJSON()))
      return encode(rs1) === encode(rs2)
    },
    onFuseChange: (rects, oldAPI) => {
      log('showSelection', rects)
      if (!rects || !rects.length)  return null
      if (oldAPI) oldAPI.destroy()

      const topRight    = {
        top:  pixel(pageY(rects[0].top)),
        left: pixel(pageX(rects[0].left + rects[0].width))
      }
      const overlayAPI  = createOverlayForRects({ color, opacity, rects })
      const badgeAPI    = needBadge ? showBridgeCount({
        text:     '' + totalCount,
        position: topRight,
        onClick:  () => showBridgesModal({ getCsAPI, bridges, annotations, elementId: link.id })
      }) : {
        show: () => {},
        hide: () => {},
        destroy: () => {}
      }

      const api = {
        ...commonShowAPI({ rects }),
        getOverlayContainer: () => {
          return overlayAPI.$container
        },
        getBadgeContainer: () => {
          return badgeAPI.$dom
        },
        getElement: () => {
          return link
        },
        show: () => {
          overlayAPI.show()
          badgeAPI.show()
        },
        hide: () => {
          overlayAPI.hide()
          badgeAPI.hide()
        },
        destroy: () => {
          overlayAPI.destroy()
          badgeAPI.destroy()
        }
      }

      onCreate(api)
      return api
    }
  })

  const api = ['getOverlayContainer', 'getBadgeContainer', 'getElement', 'show', 'hide', 'isInView', 'pointPosition'].reduce((prev, key) => {
    prev[key] = (...args) => {
      if (!liveBuildAPI)  return
      return liveBuildAPI.getAPI()[key](...args)
    }
    return prev
  }, {})

  api.destroy = () => {
    liveBuildAPI.getAPI().destroy()
    liveBuildAPI.destroy()
  }

  return api
}

export const showBridgeCount = ({ position, text, onClick, style = {} }) => {
  const size  = 40
  const $el   = createEl({
    text,
    style: {
      ...commonStyle,
      ...position,
      userSelect: 'none',
      transform:  'translate(-80%, -80%)',
      position:   'absolute',
      zIndex:     100001,
      width:      `${size}px`,
      height:     `${size}px`,
      lineHeight: `${size}px`,
      borderRadius: `${size / 2}px`,
      border:     '1px solid #666',
      fontSize:   '18px',
      fontWeight: 'bold',
      background: '#fff',
      color:      '#ef5d8f',
      cursor:     'pointer',
      textAlign:  'center',
      boxShadow:  'rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px, rgba(0, 0, 0, 0.2) 0px 3px 1px -2px',
      ...style
    }
  })

  $el.addEventListener('click', onClick)
  document.body.appendChild($el)

  return {
    $dom: $el,
    hide: () => {
      setStyle($el, { display: 'none' })
    },
    show: () => {
      setStyle($el, { display: 'block' })
    },
    destroy: () => {
      $el.removeEventListener('click', onClick)
      $el.remove()
    }
  }
}

export const showBridgesModal = ({ getCsAPI, bridges, annotations, elementId }) => {
  const iframeAPI = createIframeWithMask({
    url:    Ext.extension.getURL('related_elements.html'),
    width:  clientWidth(document),
    height: clientHeight(document),
    onAsk: (cmd, args) => {
      log('showBridgesModal onAsk', cmd, args)

      switch (cmd) {
        case 'INIT_RELATED_ELEMENTS': {
          const getExtraRelationIds = (bridges, relations) => {
            return bridges.reduce((list, b) => {
              if (!relations.find(r => r.id === b.relation)) {
                list.push(b.relation)
              }
              return list
            }, [])
          }

          return Promise.all([
            API.loadRelations(),
            API.checkUser().catch(e => null)
          ])
          .then(([relations, userInfo]) => {
            // Note: there could be relations used in bridges, but not included in your own relation list
            const extraRelationIds  = getExtraRelationIds(bridges, relations)
            const pExtraRelations   = extraRelationIds.length > 0
                                        ? API.listRelationsByIds(extraRelationIds)
                                        : Promise.resolve([])

            return pExtraRelations.then(extraRelations => {
              return {
                userInfo,
                bridges,
                annotations,
                elementId,
                relations: [...relations, ...extraRelations]
              }
            })
          })
        }

        case 'RELOAD_BRIDGES_AND_NOTES': {
          getCsAPI().showContentElements()
          return true
        }

        case 'EDIT_ANNOTATION': {
          const csAPI = getCsAPI()

          csAPI.annotate({
            mode:           C.UPSERT_MODE.EDIT,
            linkData:       args.annotation.target,
            annotationData: args.annotation,
            onSuccess: ({ annotation }) => {
              log('EDIT_ANNOTATION onSuccess', annotation)
              iframeAPI.ask('UPDATE_ANNOTATION', { annotation })
              csAPI.showContentElements()
            }
          })
          return true
        }

        case 'EDIT_BRIDGE': {
          const csAPI = getCsAPI()

          API.setLocalBridge({
            from:     args.bridge.fromElement,
            to:       args.bridge.toElement,
            relation: args.bridge.relation,
            tags:     args.bridge.tags,
            desc:     args.bridge.desc
          })
          .then(() => {
            csAPI.buildBridge({
              mode:         C.UPSERT_MODE.EDIT,
              bridgeData:   args.bridge,
              linkPair:     {
                data: {
                  links: [
                    args.bridge.fromElement,
                    args.bridge.toElement
                  ]
                }
              },
              onSuccess: ({ bridge }) => {
                log('EDIT_BRIDGE onSuccess', bridge)

                // Note: There could be new relation created,
                API.loadRelations()
                .then(relations => iframeAPI.ask('UPDATE_BRIDGE', { bridge, relations }))

                csAPI.showContentElements()
              }
            })
          })
          .catch(e => {
            log.error(e.stack)
          })

          return true
        }

        case 'CLOSE_RELATED_ELEMENTS':
          modalAPI.destroy()
          return true
      }
    }
  })

  const onResize = () => {
    setStyle(iframeAPI.$iframe, {
      width:  pixel(clientWidth(document)),
      height: pixel(clientHeight(document))
    })
  }
  window.addEventListener('resize', onResize)

  setStyle(iframeAPI.$iframe, {
    position: 'fixed',
    left: '0',
    top: '0',
    right: '0',
    bottom: '0'
  })

  const modalAPI = {
    destroy: () => {
      window.removeEventListener('resize', onResize)
      iframeAPI.destroy()
    }
  }

  return modalAPI
}
