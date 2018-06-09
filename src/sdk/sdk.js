import { genShowContentElements, bindSelectionEvent } from '../extension/scripts/content_script/common'

;(function () {
  let currentPage

  const mouseRevealConfig = {
    nearDistanceInInch:   1,
    nearVisibleDuration:  2,
    pixelsPerInch: 40
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
    getLocalBridge:       () => 'Just a placeholder',
    getMouseRevealConfig: () => mouseRevealConfig,
    onUpdateCurrentPage:  (page) => { currentPage = page }
  })

  showContentElements()
  bindSelectionEvent({ getCurrentPage })
})()
