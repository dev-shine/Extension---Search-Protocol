export default {
  id: 'zh',
  name: '中文',
  common: {
    welcome: '欢迎',
    logout: '退出',
    allRightsReserved: '版权所有',
    termsConditions: '隐私条款',
    aboutUs: '关于我们',
    relation: '关系',
    link: '链接',
    notes: '标注',
    bridges: '关联',
    close: '关闭',
    edit: '编辑',
    delete: '删除',
    save: '保存',
    cancel: '取消',
    annotate: '标注',
    createBridge: '开始关联',
    buildBridge: '完成关联',
    selectImageArea: '选择图片区域',
    updateElementForBridge: '更新关联中的元素',
    successfullyPosted: '发布成功',
    successfullySaved: '保存成功',
    successfullyLoggedIn: '登录成功',
    successfullyRegistered: '注册成功',
    successfullyDeleted: '删除成功',
    tags: '标签',
    tagsRequiredErrMsg: '请输入标签',
    tagsCountErrMsg: '请以英文逗号分隔标签，最多输入5个',
    tagsPlaceholder: '请以英文逗号分隔标签，最多输入5个',
    invalidSelectionCross: '无效的选区：选区不能与已有选区交叉',
    userDefined: '用户自定义'
  },
  afterCreateBridge: {
    awesomeText: `赞！你已选择了第一个关联项，接下来只需再选择另一个内容元素，即可完成关联`,
    pleaseText: `请在以下操作中选择一个来完成:`,
    callToAction1: `选择一个新的内容元素，点击鼠标右键，选择“完成关联”`,
    callToAction2: `将鼠标移至已有内容元素的圆形数字标签上，在出现的菜单中，点击“完成关联”`,
    hideThisMessage: `不再显示此提示`
  },
  buildBridge: {
    relationLabel: '两者的关系是?',
    relationErrMsg: '请选择这两个内容元素的关系',
    relationPlaceholder: '请选择关系',
    descLabel: '如何描述这组关联？',
    descErrMsg: '请输入描述',
    descPlaceholder: '输入对此关联的描述',
    postIt: '发布！',
    editBridge: '编辑关联',
    update: '修改'
  },
  selecteImageArea: {
    intersectExistingErrMsg: '新区域不能与现有区域存在部分交集，只可相互包含或完全独立'
  },
  createNote: {
    title: '标题',
    titleErrMsg: '请输入标题',
    titlePlaceholder: '输入此内容元素的标题',
    note: '笔记',
    noteErrMsg: '请输入笔记',
    notePlaceholder: '输入对此内容元素的笔记'
  },
  relatedElements: {
    source: '来源',
    relatedElements: '相关内容',
    sureToDeleteNote: '确定要永久删除这个标注吗？',
    sureToDeleteBridge: '确定要永久删除这个关联吗？'
  },
  settings: {
    settings: '设置',
    language: '语言',
    enableBridgit: '启用 Bridgit',
    showTipsAfterCreateBridge: `在点击“开始关联”后显示提示`,
    showWithinInches: '鼠标距离元素 X 英寸时触发展现',
    showActiveItemsForSeconds: '默认展现元素 X 秒'
  },
  loginRegister: {
    login: '登录',
    register: '注册',
    email: '邮箱',
    emailRequiredErrMsg: '请输入邮箱',
    emailFormatErrMsg: '邮箱格式错误',
    emailPlaceholder: 'Email',
    passwordErrMsg: '请输入密码',
    passwordPlaceholder: '密码',
    registerHint: '为了更好地使用 Bridgit，请让我们多了解您一些',
    nameErrMsg: '请输入您的姓名',
    namePlaceholder: '姓名',
    signInWithGoogle: '用 Google 账号登录'
  },
  upsertRelation: {
    addRelation: '添加关系',
    activeName: '主动名称',
    activeNameErrMsg: '请输入主动名称',
    activeNamePlaceholder: '请输入此关系的主动名称，例如：支持',
    passiveName: '被动名称',
    passiveNameErrMsg: '请输入被动名称',
    passiveNamePlaceholder: '请输入此关系的被动名称，例如：被支持'
  }
}
