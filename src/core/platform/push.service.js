import { isNativeApp, getPlatform } from '@/core/platform/runtime.js'
import mobileApi from '@/core/api/mobile.api.js'

const isPushEnabled = () => process.env.VUE_APP_ENABLE_PUSH === 'true'

const getPlugin = () => window?.Capacitor?.Plugins?.PushNotifications

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

  const plugin = getPlugin()
  if (!plugin?.checkPermissions) {
    return 'unsupported'
  }

  const status = await plugin.checkPermissions()
  return status.receive || 'prompt'
}

export const requestPushPermission = async () => {
  if (!isNativeApp() || !isPushEnabled()) {
    return 'unsupported'
  }

  const plugin = getPlugin()
  if (!plugin?.requestPermissions) {
    return 'unsupported'
  }

  const permission = await plugin.requestPermissions()
  return permission.receive || 'prompt'
}

export const registerPushToken = async ({ token, enabled = true }) => {
  if (!token) return

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

  const plugin = getPlugin()
  if (!plugin?.register) {
    console.warn('[push] PushNotifications plugin is unavailable')
    return () => {}
  }

  const subscriptions = []

  const registrationSub = await plugin.addListener('registration', async (tokenPayload) => {
    const token = tokenPayload?.value
    await registerPushToken({ token, enabled: true })
  })
  subscriptions.push(registrationSub)

  const registrationErrorSub = await plugin.addListener('registrationError', (error) => {
    console.error('[push] registration error:', error)
  })
  subscriptions.push(registrationErrorSub)

  if (onNotificationReceived) {
    const receiveSub = await plugin.addListener('pushNotificationReceived', onNotificationReceived)
    subscriptions.push(receiveSub)
  }

  if (onNotificationActionPerformed) {
    const actionSub = await plugin.addListener('pushNotificationActionPerformed', onNotificationActionPerformed)
    subscriptions.push(actionSub)
  }

  const permissionStatus = await getPushPermissionStatus()
  if (permissionStatus === 'prompt') {
    const requested = await requestPushPermission()
    if (requested !== 'granted') {
      return () => {
        subscriptions.forEach((listener) => listener.remove())
      }
    }
  }

  await plugin.register()

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
  registerPushToken,
  setPushPreference,
  deletePushToken
}
