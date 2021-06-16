import settings from '../../Google/vue/settings'

export default {
  name: 'GoogleWebclient',
  init (appData) {
    settings.init(appData)
  },
  getAdminSystemTabs () {
    return [
      {
        name: 'google',
        title: 'GOOGLE.LABEL_SETTINGS_TAB',
        component () {
          return import('src/../../../Google/vue/components/GoogleAdminSettings')
        },
      },
    ]
  },
}
