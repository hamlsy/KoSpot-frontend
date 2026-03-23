const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const MEMBER_ID_KEY = 'memberId'

const safeGet = (key) => {
  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.error(`[authStorage] Failed to read ${key}:`, error)
    return null
  }
}

const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    console.error(`[authStorage] Failed to write ${key}:`, error)
  }
}

const safeRemove = (key) => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`[authStorage] Failed to remove ${key}:`, error)
  }
}

export const authStorage = {
  getAccessToken() {
    return safeGet(ACCESS_TOKEN_KEY)
  },

  getRefreshToken() {
    return safeGet(REFRESH_TOKEN_KEY)
  },

  getMemberId() {
    return safeGet(MEMBER_ID_KEY)
  },

  setAccessToken(token) {
    if (!token) return
    safeSet(ACCESS_TOKEN_KEY, token)
  },

  setRefreshToken(token) {
    if (!token) return
    safeSet(REFRESH_TOKEN_KEY, token)
  },

  setMemberId(memberId) {
    if (memberId === undefined || memberId === null) return
    safeSet(MEMBER_ID_KEY, String(memberId))
  },

  setTokens({ accessToken, refreshToken, memberId }) {
    if (accessToken) {
      this.setAccessToken(accessToken)
    }

    if (refreshToken) {
      this.setRefreshToken(refreshToken)
    }

    if (memberId !== undefined && memberId !== null) {
      this.setMemberId(memberId)
    }
  },

  clearAuth() {
    safeRemove(ACCESS_TOKEN_KEY)
    safeRemove(REFRESH_TOKEN_KEY)
    safeRemove(MEMBER_ID_KEY)
  },

  isAuthenticated() {
    return !!this.getAccessToken()
  }
}

export default authStorage
