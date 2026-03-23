const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '')

const toSockJsHttpProtocol = (url) => {
  if (url.startsWith('ws://')) {
    return `http://${url.slice(5)}`
  }

  if (url.startsWith('wss://')) {
    return `https://${url.slice(6)}`
  }

  return url
}

export const resolveSockJsUrl = () => {
  const raw = process.env.VUE_APP_WS_URL || '/ws'
  const normalized = trimTrailingSlash(raw)

  return toSockJsHttpProtocol(normalized)
}

export default {
  resolveSockJsUrl
}
