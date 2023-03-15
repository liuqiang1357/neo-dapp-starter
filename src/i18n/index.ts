import i18n, { Resource } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { merge } from 'lodash-es';
import { initReactI18next } from 'react-i18next';

const resources: Resource = {};
const context = require.context('./locales', true, /^(?!.*\/_).*\.json$/);

for (const path of context.keys()) {
  const parts = path.split('/');
  const namespace = parts.pop()?.replace(/\.\w+$/, '');
  const language = parts.pop();
  if (namespace != null && language != null) {
    merge(resources, { [language]: { [namespace]: context(path) } });
  }
}

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });
