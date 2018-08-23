export default {
  id: 'en',
  name: 'English',
  common: {
    welcome: 'Welcome',
    logout: 'Log out',
    allRightsReserved: 'All Rights Reserved',
    termsConditions: 'Terms & Conditions',
    aboutUs: 'About Us',
    relation: 'Relation',
    link: 'Link',
    notes: 'Notes',
    bridges: 'Bridges',
    close: 'Close',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    annotate: 'Make a Note',
    createBridge: 'Begin Bridge',
    buildBridge: 'Build It!',
    follow: 'Follow',
    unfollow: 'Unfollow',
    selectImageArea: 'Select Area',
    updateElementForBridge: 'Update Content Element for Bridge',
    successfullyPosted: 'Successfully posted',
    successfullySaved: 'Successfully saved',
    successfullyLoggedIn: 'successfully logged in',
    successfullyRegistered: 'successfully registered',
    successfullyDeleted: 'successfully deleted',
    tags: 'Tags',
    tagsRequiredErrMsg: 'Please input tags',
    tagsCountErrMsg: 'Enter up to 5 tags separated by commas',
    sameDescErrMsg: 'Please modify the description',
    tagsPlaceholder: 'Enter up to 5 tags separated by commas',
    tagsPlaceholderAnnotation: 'Enter up to 5 tags separated by commas. Add "keeper" tag if you want us to keep this note.',
    tagsPlaceholderBridge: 'Enter up to 5 tags separated by commas. Add "keeper" tag if you want us to keep this bridge.',
    invalidSelectionCross: 'Invalid Selection: Selection cannot cross content element boundaries',
    userDefined: 'User Defined',
    contentCategories: {
      '0':'Film & Animation',
      '1':'Autos & Vehicles',
      '2':'Music',
      '3':'Pets & Animals',
      '4':'Sports',
      '5':'Travel & Events',
      '6':'Gaming',
      '7':'People & Blogs',
      '8':'Comedy',
      '9':'Entertainment',
      '10':'News & Politics',
      '11':'Howto & Style',
      '12':'Education',
      '13':'Science & Technology',
      '14':'Nonprofits & Activism'
    },
    flagBridgeCategories: {
      '0':'inaccurate relationship',
      '1':'problematic content',
      '2':'subpar content element placement',
      '3':'language issues, gibberish'
    },
    flagNoteCategories: {
      '0':'sexual content',
      '1':'violent content',
      '2':'hate speech',
      '3':'language issues',
      '4':'gibberish'
    }
  },
  afterCreateBridge: {
    awesomeText: `Awesome! You've selected the content element that is one side of the bridge. Now you need to select the content element that will be the other side of the bridge.`,
    pleaseText: `Please do one of the following:`,
    callToAction1: `Select a new content element, right click, and select "Build Bridge"`,
    callToAction2: `Move to the circular indicator associated with an existing content element and select "Build Bridge"`,
    hideThisMessage: `Do not show this message again`
  },
  elementDescription: {
    titleLabel: 'Title',
    descLabel: 'Description',
    titlePlaceholder: 'Name this content element. Try to sum it up in a phrase',
    descPlaceholder: 'Add a description for this Element',
    titleErrMsg: 'Please input title',
    descErrMsg: 'Please input description',
    successfullyFollowed: 'Sucessfully followed',
    defineElementBeforeFollow: 'Please give title and description of the element to follow'
  },
  buildBridge: {
    relationLabel: 'How are these content elements related?',
    relationErrMsg: 'Please select a relationship between the two content elements',
    relationPlaceholder: 'Choose a relationship',
    descLabel: 'What do you want to say about this bridge?',
    descErrMsg: 'Please input description',
    descPlaceholder: 'Enter the Description for this Bridge',
    postIt: 'POST IT!',
    editBridge: 'Edit Bridge',
    update: 'Update'
  },
  selecteImageArea: {
    intersectExistingErrMsg: 'New area must not intersect with existing ones'
  },
  createNote: {
    title: 'Title',
    titleErrMsg: 'Please input title',
    titlePlaceholder: 'Name your annotation. Try to sum it up in a phrase',
    note: 'Note',
    noteErrMsg: 'Please enter the text of your Note here',
    notePlaceholder: 'Enter Note for this content',
    relationErrMsg: 'Please select a category',
    relationLabel: 'Category',
    relationPlaceholder: 'Choose a category'
  },
  relatedElements: {
    source: 'Source',
    relatedElements: 'Bridgit: Related Bridges and Notes',
    sureToDeleteNote: 'Are you sure you want to Permanently delete this Note?',
    sureToDeleteBridge: 'Are you sure you want to Permanently delete this Bridge?'
  },
  settings: {
    settings: 'Settings',
    language: 'Language',
    enableBridgit: 'Enable Bridgit',
    showTipsAfterCreateBridge: `Show tips after 'create bridge'`,
    showWithinInches: 'Show if cursor is within X inches',
    showActiveItemsForSeconds: 'Display active items for Y seconds'
  },
  loginRegister: {
    login: 'Sign In',
    register: 'Register',
    email: 'Email',
    emailRequiredErrMsg: 'Please input email',
    emailFormatErrMsg: 'invalid email',
    emailPlaceholder: 'Email',
    passwordErrMsg: 'Please input your Password',
    passwordPlaceholder: 'Password',
    registerHint: 'To start sharing with Bridgit, give us a little info.',
    nameErrMsg: 'Please input your full name',
    namePlaceholder: 'Full name',
    signInWithGoogle: 'Sign in with Google'
  },
  upsertRelation: {
    addRelation: 'Add Relation',
    activeName: 'Active Name',
    activeNameErrMsg: 'Please input active name',
    activeNamePlaceholder: 'Enter the active form of the relationship. E.g., Supports',
    passiveName: 'Passive Name',
    passiveNameErrMsg: 'Please input passive name',
    passiveNamePlaceholder: 'Enter the active form of the relationship. E.g., Is Supported By'
  },
  upsertCategory: {
    addCategory: 'Add Category',
    name: 'Name',
    nameErrMsg: 'Please input name',
    namePlaceHolder: 'Enter the name of category'
  },
  privacy: {
    privacyLabel: 'Who should see this?',
    privacyErrMsg: 'Please select privacy',
    privacyPlaceholder: 'Who should see this?',
    public: 'Public',
    onlyMe: 'Only me'
  },
  flagContent:{
    headingBridge: 'Give feedback on this Bridge',
    headingNote: 'Give feedback on this Note',
    categoryLabel: 'Select Category',
    categoryErrMsg: 'Please select category',
    categoryPlaceholder: 'Select category',
    commentLabel: 'What do you think is problematic',
    successfullyFlagged: 'We\'ve informed the admins about the content'
  }
}
