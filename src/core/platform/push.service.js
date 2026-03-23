import { isNativeApp, getPlatform } from '@/core/platform/runtime.js'
import mobileApi from '@/core/api/mobile.api.js'
import { PushNotifications } from '@capacitor/push-notifications'
import { authStorage } from '@/core/auth/authStorage.service.js'

const isPushEnabled = () => process.env.VUE_APP_ENABLE_PUSH === 'true'

const getAppVersion = () => process.env.VUE_APP_BUILD_VERSION || 'unknown'

const getDeviceId = () => {
  const existing = localStorage.getItem('mobileDeviceId')
  if (existing) return existing

  const generated = `webview-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  localStorage.setItem('mobileDeviceId', generated)
  return generated
}

export const getPushPermissionStatus = async () => {
  if (!isNativeApp() || !isPushEnabled()) {
    return 'unsupported'
  }

  const status = await PushNotifications.checkPermissions()
  return status.receive || 'prompt'
}

export const requestPushPermission = async () => {
  if (!isNativeApp() || !isPushEnabled()) {
    return 'unsupported'
  }

  const permission = await PushNotifications.requestPermissions()
  return permission.receive || 'prompt'
}

export const registerPushIfPermitted = async () => {
  const permissionStatus = await getPushPermissionStatus()
  if (permissionStatus !== 'granted') {
    return false
  }

  await PushNotifications.register()
  return true
}

export const registerPushToken = async ({ token, enabled = true }) => {
  if (!token) return
  if (!authStorage.isAuthenticated()) return

  await mobileApi.upsertPushToken({
    token,
    platform: getPlatform(),
    appId: process.env.VUE_APP_APP_ID || 'com.kospot.app',
    enabled,
    permissionStatus: 'granted',
    appVersion: getAppVersion(),
    deviceId: getDeviceId()
  })
}

export const getServerPushPreference = async () => {
  const response = await mobileApi.getPushPreference()
  const result = response?.data?.result

  if (typeof result?.enabled === 'boolean') {
    return result.enabled
  }

  if (typeof response?.data?.enabled === 'boolean') {
    return response.data.enabled
  }

  return null
}

export const setPushPreference = async (enabled) => {
  await mobileApi.updatePushPreference(enabled)
}

export const deletePushToken = async (token) => {
  if (!token) return
  await mobileApi.deletePushToken(token)
}

export const initializePush = async ({ onNotificationReceived, onNotificationActionPerformed } = {}) => {
  if (!isNativeApp() || !isPushEnabled()) {
    return () => {}
  }

  const subscriptions = []

  const registrationSub = await PushNotifications.addListener('registration', async (tokenPayload) => {
    const token = tokenPayload?.value
    if (token) {
      localStorage.setItem('fcmToken', token)
    }
    await registerPushToken({ token, enabled: true })
  })
  subscriptions.push(registrationSub)

  const registrationErrorSub = await PushNotifications.addListener('registrationError', (error) => {
    console.error('[push] registration error:', error)
  })
  subscriptions.push(registrationErrorSub)

  if (onNotificationReceived) {
    const receiveSub = await PushNotifications.addListener('pushNotificationReceived', onNotificationReceived)
    subscriptions.push(receiveSub)
  }

  if (onNotificationActionPerformed) {
    const actionSub = await PushNotifications.addListener('pushNotificationActionPerformed', onNotificationActionPerformed)
    subscriptions.push(actionSub)
  }

  await registerPushIfPermitted()

  return () => {
    subscriptions.forEach((listener) => {
      try {
        listener.remove()
      } catch (error) {
        console.warn('[push] listener cleanup failed:', error)
      }
    })
  }
}

export default {
  initializePush,
  getPushPermissionStatus,
  requestPushPermission,
  registerPushIfPermitted,
  registerPushToken,
  getServerPushPreference,
  setPushPreference,
  deletePushToken
}
