import { Capacitor } from '@capacitor/core'

export const isNativeApp = () => {
  return Capacitor.isNativePlatform()
}

export const getPlatform = () => {
  return Capacitor.getPlatform()
}

export const isAndroidApp = () => isNativeApp() && getPlatform() === 'android'

export const isIosApp = () => isNativeApp() && getPlatform() === 'ios'

export const isWeb = () => !isNativeApp()

export default {
  isNativeApp,
  getPlatform,
  isAndroidApp,
  isIosApp,
  isWeb
}
