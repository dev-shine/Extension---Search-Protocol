import React from 'react'
import { translate } from 'react-i18next'
import './footer.scss'

class Footer extends React.Component {
  render () {
    const { t } = this.props

    return (
      <div className="footer">
        <span>2017 &copy; Bridgit | {t('allRightsReserved')}</span>
        <br/>
        <a href="http://bridgit.io/" target="_blank">{t('termsConditions')}</a>
        <a href="http://bridgit.io/" target="_blank">{t('aboutUs')}</a>
      </div>
    )
  }
}

export default translate()(Footer)
