import i18n from 'i18next';

const resources = {
  en: {
    translation: {
      invoices: 'Invoices',
      payments: 'Payments',
      profile: 'Profile',
      loading: 'Loading...',
      noInvoices: 'No invoices yet',
      noPayments: 'No payments found',
      profileNotFound: 'Profile not found',
    },
  },
};

i18n.init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
