import { genShowContentElements, bindSelectionEvent } from '../extension/scripts/content_script/common'
import { getPPI } from '../common/dom_utils'

;(function () {
  let currentPage

  const mouseRevealConfig = {
    nearDistanceInInch:   3,
    nearVisibleDuration:  2,
    pixelsPerInch: getPPI()
  }
  const getCurrentPage = () => currentPage
  const getCsAPI = () => ({
    showContentElements,
    annotate:         () => {},
    buildBridge:      () => {},
    selectImageArea:  () => {}
  })
  const showContentElements = genShowContentElements({
    getCsAPI,
    showSubMenu:          false,
    getLocalBridge:       () => 'Just a placeholder',
    getMouseRevealConfig: () => mouseRevealConfig,
    onUpdateCurrentPage:  (page) => { currentPage = page }
  })

  showContentElements()
  bindSelectionEvent({ getCurrentPage })
})()
