<template>
  <q-scroll-area class="full-height full-width">
    <div class="q-pa-lg">
      <div class="row q-mb-md">
        <div class="col text-h5" v-t="'GOOGLE.HEADING_SETTINGS'" />
      </div>
      <q-card flat bordered class="card-edit-settings">
        <q-card-section>
          <div class="row">
            <q-item>
              <q-item-section>
                <q-checkbox v-model="enableGoogle" color="teal">
                  <q-item-label caption v-t="'GOOGLE.ENABLE_MODULE'"></q-item-label>
                </q-checkbox>
              </q-item-section>
            </q-item>
          </div>
          <div class="row q-mb-md q-ml-md">
            <div class="col-1 q-my-sm q-ml-md required-field" v-t="'OAUTHINTEGRATORWEBCLIENT.LABEL_APP_ID'"></div>
            <div class="col-5 q-ml-xl">
              <q-input outlined dense class="bg-white" v-model="appId"/>
            </div>
          </div>
          <div class="row q-mb-md q-ml-md">
            <div class="col-1 q-my-sm q-ml-md required-field" v-t="'OAUTHINTEGRATORWEBCLIENT.LABEL_APP_SECRET'"></div>
            <div class="col-5 q-ml-xl">
              <q-input outlined dense class="bg-white" v-model="appSecret"/>
            </div>
          </div>
          <div class="row q-mb-md q-ml-md">
            <div class="col-1 q-my-sm q-ml-md required-field" v-t="'GOOGLE.LABEL_API_KEY'"></div>
            <div class="col-5 q-ml-xl">
              <q-input outlined dense class="bg-white" v-model="apiKey"/>
            </div>
          </div>
          <div class="row q-ml-md">
            <q-item-label caption>
              <span class="q-ml-sm" v-t="'GOOGLE.INFO_SETTINGS'" />
            </q-item-label>
          </div>
          <div class="row">
            <q-item>
              <q-item-section>
                <q-checkbox v-model="auth" color="teal">
                  <q-item-label caption v-t="'GOOGLEAUTHWEBCLIENT.SCOPE_AUTH'"/>
                </q-checkbox>
              </q-item-section>
            </q-item>
          </div>
          <div class="row">
            <q-item>
              <q-item-section>
                <q-checkbox v-model="storage" color="teal">
                  <q-item-label caption v-t="'GOOGLEDRIVE.SCOPE_FILESTORAGE'"/>
                </q-checkbox>
              </q-item-section>
            </q-item>
          </div>
        </q-card-section>
      </q-card>
      <div class="q-pt-md text-right">
        <q-btn unelevated no-caps dense class="q-px-sm" :ripple="false" color="primary" @click="saveGoogleSettings"
               :label="saving ? $t('COREWEBCLIENT.ACTION_SAVE_IN_PROGRESS') : $t('COREWEBCLIENT.ACTION_SAVE')">
        </q-btn>
      </div>
    </div>
    <UnsavedChangesDialog ref="unsavedChangesDialog"/>
  </q-scroll-area>
</template>

<script>
import UnsavedChangesDialog from 'src/components/UnsavedChangesDialog'
import webApi from 'src/utils/web-api'
import settings from '../../../Google/vue/settings'
import notification from 'src/utils/notification'
import errors from 'src/utils/errors'
import _ from 'lodash'

export default {
  name: 'GoogleAdminSettings',
  components: {
    UnsavedChangesDialog
  },
  data() {
    return {
      enableGoogle: false,
      auth: false,
      storage: false,
      saving: false,
      appId: '',
      apiKey: '',
      appSecret: '',
      scopes: []
    }
  },
  mounted() {
    this.populate()
  },
  beforeRouteLeave(to, from, next) {
    if (this.hasChanges() && _.isFunction(this?.$refs?.unsavedChangesDialog?.openConfirmDiscardChangesDialog)) {
      this.$refs.unsavedChangesDialog.openConfirmDiscardChangesDialog(next)
    } else {
      next()
    }
  },
  methods: {
    hasChanges() {
      const data = settings.getGoogleSettings()
      let hasChangesScopes = false
      this.scopes.forEach((scope) => {
        if (!hasChangesScopes) {
          if (scope.Name === 'auth') {
            hasChangesScopes = this.auth !== scope.Value
          } else if (scope.Name === 'storage') {
            hasChangesScopes = this.storage !== scope.Value
          }
        }
      })
      return this.enableGoogle !== data.EnableModule ||
          this.appId !== data.Id ||
          this.apiKey !== data.Key || hasChangesScopes ||
          this.appSecret !== data.Secret
    },
    populate() {
      const data = settings.getGoogleSettings()
      this.enableGoogle = data.EnableModule
      this.appId = data.Id
      this.apiKey = data.Key
      this.scopes = data.Scopes
      this.appSecret = data.Secret
      this.scopes.forEach((scope) => {
        if (scope.Name === 'auth') {
          this.auth = scope.Value
        } else if (scope.Name === 'storage') {
          this.storage = scope.Value
        }
      })
    },
    saveGoogleSettings() {
      if (this.appId && this.apiKey && this.appSecret) {
        this.save()
      } else {
        notification.showError(this.$t('MAILWEBCLIENT.ERROR_REQUIRED_FIELDS_EMPTY'))
      }
    },
    save() {
      if (!this.saving) {
        this.saving = true
        this.scopes.forEach((scope) => {
          if (scope.Name === 'auth') {
            scope.Value = this.auth
          } else if (scope.Name === 'storage') {
            scope.Value = this.storage
          }
        })
        const parameters = {
          EnableModule: this.enableGoogle,
          Id: this.appId,
          Secret: this.appSecret,
          Key: this.apiKey,
          Scopes: this.scopes
        }
        webApi.sendRequest({
          moduleName: 'Google',
          methodName: 'UpdateSettings',
          parameters,
        }).then(result => {
          this.saving = false
          if (result === true) {
            settings.saveGoogleSettings(parameters)
            this.populate()
            notification.showReport(this.$t('COREWEBCLIENT.REPORT_SETTINGS_UPDATE_SUCCESS'))
          } else {
            notification.showError(this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED'))
          }
        }, response => {
          this.saving = false
          notification.showError(errors.getTextFromResponse(response, this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED')))
        })
      }
    }
  }
}
</script>

<style scoped>

</style>
