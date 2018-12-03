import React, { Component } from 'react'
import { Modal, Select, Form, Input, Button } from 'antd'
import { translate } from 'react-i18next'

import { notifyError, notifySuccess } from '../components/notification'
import ipc from '../common/ipc/ipc_dynamic'
import API from 'cs_api'
import log from '../common/log'
import * as C from '../common/constant'
import { compose, setIn, updateIn } from '../common/utils'
import CreateLinkComp from '../components/create_link'
import './app.scss'

class App extends Component {
  state = {
    mode:       null,
    linkPair:   null,
    bridgeData: null,
    relations:  [],
    categories:  [],
    selectedCategory: '',
    selectedRelation: undefined,
    isButtonDisabled: false
  }

  onClose = () => {
    ipc.ask('CLOSE')
  }

  onAddRelation = () => {
    ipc.ask('ADD_RELATION')
  }

  onAddSubCategory = () => {
    ipc.ask('ADD_SUB_CATEGORY', {selected_category: this.state.selectedCategory || ''})
  }

  onUpdateField = (val, field) => {
    this.setState(
      compose(
        setIn(['bridgeData', field], val),
        field === 'relation' ? setIn(['selectedRelation'], val) : x => x,
        field === 'category' ? setIn(['selectedCategory'], val) : x => x
      )(this.state)
    )

    // if (this.state.mode === C.UPSERT_MODE.EDIT) {
    //   API.updateElementInLocalBridge({ [field]: val })
    // }
  }

  onSubmitAdd = (data) => {
    const { t } = this.props

    API.createBridge(data)
    .then(bridge => {
      ipc.ask('DONE', { bridge })
      notifySuccess(t('successfullyPosted'))
      setTimeout(() => {
        this.onClickCancel()
        this.setState({isButtonDisabled: false})
      }, 1500)
    })
    .catch(e => {
      notifyError(e.message)
      this.setState({isButtonDisabled: false})
    })
  }

  onSubmitEdit = (data) => {
    const { t } = this.props

    API.updateBridge(this.state.bridgeData.id, {
      id: this.state.bridgeData.id,
      ...data
    })
    .then(bridge => {
      ipc.ask('DONE', { bridge })
      notifySuccess(t('successfullyPosted'))
      setTimeout(() => {
        this.onClickCancel()
        this.setState({isButtonDisabled: false})
      }, 1500)
    })
    .catch(e => {
      notifyError(e.message)
      this.setState({isButtonDisabled: false})
    })
  }

  onClickSubmit = (data) => {

    this.setState({isButtonDisabled: true})
    switch (this.state.mode) {
      case C.UPSERT_MODE.ADD:
        return this.onSubmitAdd(data)

      case C.UPSERT_MODE.EDIT:
        return this.onSubmitEdit(data)
    }
  }

  onClickCancel = () => {
    API.resetLocalBridge()
    this.onClose()
  }

  componentDidMount () {
    ipc.ask('INIT')
    .then(({ bridgeData, linkPair, mode, relations, categories }) => {
      
      log('buildBridge, INIT GOT', { bridgeData, linkPair, mode })
      this.setState({
        mode,
        bridgeData,
        relations,
        categories,
        selectedRelation: bridgeData ? bridgeData.relation : undefined,
        selectedCategory: bridgeData.category || '',
        ...(linkPair ? { linkPair } : {})
      })

      if (!linkPair) {
        API.getLocalBridgeStatus()
        .then(linkPair => {
          log('got linkPair', linkPair)
          this.setState({ linkPair })
        })
      }
    })

    ipc.onAsk((cmd, args) => {
      switch (cmd) {
        case 'SELECT_NEW_RELATION': {
          log('SELECT_NEW_RELATION', cmd, args)
          this.setState({
            relations: [...this.state.relations, args.relation],
            selectedRelation: args.relation.id
          })
          return true
        }

        case 'SELECT_NEW_SUB_CATEGORY': {
          log('SELECT_NEW_SUB_CATEGORY', cmd, args)

          const {sub_category} = args;
          this.state.categories.map(category => {
            if (category.id == sub_category.category_id)
              category.sub_category.push(sub_category);
          })
          const bridge_data = {...this.state.bridgeData, category: sub_category.category_id, sub_category: sub_category.id}
          this.setState({
            selectedCategory: sub_category.category_id,
            bridgeData: bridge_data
          })

          return true
        } 

      }
    })
  }

  render () {
    if (!this.state.mode) return <div />

    log('to render CreateLinkComp', this.state.bridgeData)
    return (
      <CreateLinkComp
        mode={this.state.mode}
        bridge={this.state.bridgeData}
        relations={this.state.relations}
        categories={this.state.categories}
        selectedRelation={this.state.selectedRelation}
        selectedCategory={this.state.selectedCategory}
        linkPair={this.state.linkPair}
        onUpdateField={this.onUpdateField}
        onAddRelation={this.onAddRelation}
        onAddSubCategory = {this.onAddSubCategory}
        isButtonDisabled = {this.state.isButtonDisabled}
        onSubmit={this.onClickSubmit}
        onCancel={this.onClickCancel}
      />
    )
  }
}

export default translate(['common', 'buildBridge'])(App)
