const getCapacitorGlobal = () => {
  if (typeof window === 'undefined') return null
  return window.Capacitor || null
}

export const isNativeApp = () => {
  const capacitor = getCapacitorGlobal()

  if (capacitor?.isNativePlatform) {
    return capacitor.isNativePlatform()
  }

  return false
}

export const getPlatform = () => {
  const capacitor = getCapacitorGlobal()

  if (capacitor?.getPlatform) {
    return capacitor.getPlatform()
  }

  return 'web'
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
