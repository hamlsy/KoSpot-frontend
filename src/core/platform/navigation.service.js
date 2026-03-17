import { isNativeApp } from './runtime.js'

export const hardRedirect = (url) => {
  if (!url) return
  window.location.href = url
}

export const openExternalUrl = async (url) => {
  if (!url) return

  if (isNativeApp()) {
    const browserPlugin = window?.Capacitor?.Plugins?.Browser
    if (browserPlugin?.open) {
      await browserPlugin.open({ url })
      return
    }
  }

  window.open(url, '_blank')
}

export default {
  hardRedirect,
  openExternalUrl
}
