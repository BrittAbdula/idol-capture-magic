import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        "nav.home": "Home",
        "nav.selca": "Selca",
        "nav.photocard": "Photocard",
        "nav.strip": "Strip",
        "auth.guest": "Guest mode"
      }
    }
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
