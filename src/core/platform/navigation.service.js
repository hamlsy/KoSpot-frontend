import { isNativeApp } from './runtime.js'
import { Browser } from '@capacitor/browser'

export const hardRedirect = (url) => {
  if (!url) return
  window.location.href = url
}

export const openExternalUrl = async (url) => {
  if (!url) return

  if (isNativeApp()) {
    try {
      await Browser.open({ url })
      return
    } catch (error) {
      console.warn('[navigation] Native browser open failed, fallback to window.open:', error)
    }
  }

  window.open(url, '_blank')
}

export default {
  hardRedirect,
  openExternalUrl
}
