const parseIncomingUrl = (url) => {
  try {
    const parsed = new URL(url)
    const pathname = parsed.pathname || '/'

    // 모바일 OAuth 복귀: /auth/callback?code=...
    if (pathname === '/auth/callback') {
      const code = parsed.searchParams.get('code')
      const state = parsed.searchParams.get('state')
      const params = new URLSearchParams()

      if (code) {
        params.set('code', code)
      }

      if (state) {
        params.set('state', state)
      }

      const query = params.toString()
      return query ? `/login/oauth2/callback?${query}` : '/login/oauth2/callback'
    }

    const query = parsed.search || ''
    const hash = parsed.hash || ''
    return `${pathname}${query}${hash}`
  } catch (error) {
    console.warn('[deeplink] Invalid app URL:', url, error)
    return null
  }
}

export const registerDeepLinkListener = async (router) => {
  const appPlugin = window?.Capacitor?.Plugins?.App

  if (!appPlugin?.addListener || !router) {
    return () => {}
  }

  const listener = await appPlugin.addListener('appUrlOpen', (event) => {
    const targetPath = parseIncomingUrl(event?.url)
    if (!targetPath) {
      return
    }

    router.replace(targetPath).catch((error) => {
      if (error?.name !== 'NavigationDuplicated') {
        console.warn('[deeplink] Navigation failed:', error)
      }
    })
  })

  return () => {
    try {
      listener.remove()
    } catch (error) {
      console.warn('[deeplink] Failed to remove listener:', error)
    }
  }
}

export default {
  registerDeepLinkListener
}
