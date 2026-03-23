import { isNativeApp, getPlatform } from '@/core/platform/runtime.js'

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '')

export const getApiBaseUrl = () => {
  const explicitAuthorizeBase = process.env.VUE_APP_OAUTH_AUTHORIZE_BASE_URL
  if (explicitAuthorizeBase) {
    return trimTrailingSlash(explicitAuthorizeBase)
  }

  const apiBaseUrl = process.env.VUE_APP_API_BASE_URL || '/api'
  return trimTrailingSlash(apiBaseUrl)
}

export const buildOAuthAuthorizeUrl = (provider) => {
  const baseUrl = getApiBaseUrl()
  const url = new URL(`${baseUrl}/oauth2/authorization/${provider}`, window.location.origin)

  if (isNativeApp() && isMobileOAuthEnabled()) {
    url.searchParams.set('platform', 'app')
    url.searchParams.set('client_type', getPlatform())
  }

  return url.toString()
}

export const isMobileOAuthEnabled = () => process.env.VUE_APP_OAUTH_MOBILE_ENABLED === 'true'

export default {
  getApiBaseUrl,
  buildOAuthAuthorizeUrl,
  isMobileOAuthEnabled
}
