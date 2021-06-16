import _ from 'lodash'

import typesUtils from 'src/utils/types'

class GoogleSettings {
  constructor (appData) {
    const googleWebclientData = typesUtils.pObject(appData.Google)
    if (!_.isEmpty(googleWebclientData)) {
      this.displayName = googleWebclientData.DisplayName
      this.enableModule = googleWebclientData.EnableModule
      this.id = googleWebclientData.Id
      this.key = googleWebclientData.Key
      this.name = googleWebclientData.Name
      this.scopes = googleWebclientData.Scopes
      this.secret = googleWebclientData.Secret
    }
  }

  saveGoogleSettings ({ EnableModule, Id, Key, Scopes, Secret }) {
    this.enableModule = EnableModule
    this.id = Id
    this.key = Key
    this.scopes = Scopes
    this.secret = Secret
  }
}

let settings = null

export default {
  init (appData) {
    settings = new GoogleSettings(appData)
  },
  saveGoogleSettings (data) {
    settings.saveGoogleSettings(data)
  },
  getGoogleSettings () {
    return {
      DisplayName: settings.displayName,
      EnableModule: settings.enableModule,
      Id: settings.id,
      Key: settings.key,
      Name: settings.name,
      Scopes: settings.scopes,
      Secret: settings.secret
    }
  },

}
