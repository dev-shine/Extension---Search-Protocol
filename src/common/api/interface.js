
// Note: the reason why we need a standalone `interface.js`, is because
// 1. we want to make `bg_api` the only entry to make real API request
// 2. we don't want any dependencies of bg_api to be bundled into `cs.js`, `popup.js`
//
// So instead of imporing `bg_api.js`, we violate DRY and duplicate each API method name here as an array
// It means, whatever API you add to `bg_api.js`, you need to copy method names here
export const methods = [
  'getCurrentPageInfo',
  'createTab',
  'askCurrentTab',
  'startAnnotationOnCurrentTab',
  'captureScreenInSelection',
  'showElementInCurrentTab',
  'openSocialLogin',
  'changeLanguage',
  'addGAMessage',

  // http API
  'login',
  'logout',
  'register',
  'signInWithGoogle',
  'checkUser',
  'createRelation',
  'loadRelations',
  'listRelationsByIds',
  'saveAccessToken',
  'updateNote',
  'deleteNote',
  'updateBridge',
  'deleteBridge',
  'userFollow',
  'createElementDescription',
  'elementFollow',

  // backend API
  'createContentElement',
  'createAnnotation',
  'createBridge',
  'annotationsAndBridgesByUrl',
  'annotationsAndBridgesByUrls',
  'loadElementsByIds',
  'clearAllData',

  'loadLinksForCurrentPage',
  'getLocalBridgeStatus',
  'setLocalBridge',
  'addElementToLocalBridge',
  'updateElementInLocalBridge',
  'updateLocalBridge',
  'createLocalBridge',
  'buildLocalBridge',
  'resetLocalBridge',
  'recordLastAnnotation',
  'startEditBridge',
  'endEditBridge',

  'hackHeader',
  'resetUserSettings',
  'getUserSettings',
  'updateUserSettings'
]

export const mockAPIWithIPC = (ipc) => {
  return methods.reduce((prev, method) => {
    prev[method] = (...params) => ipc.ask('API_CALL', { method, params })
    return prev
  }, {})
}
