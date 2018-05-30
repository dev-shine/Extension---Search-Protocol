import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { reactI18nextModule } from 'react-i18next'
import en from './en'
import zh from './zh'

i18n
  .use(LanguageDetector)
  .use(reactI18nextModule)
  .init({
    lng: 'zh',
    fallbackLng: 'en',
    defaultNS: 'common',
    resources: {
      en,
      zh
    }
  })

export default i18n

export const languages = [en, zh]
