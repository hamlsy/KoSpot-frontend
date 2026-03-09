import axios from 'axios'

/**
 * 오늘의 MVP 정보를 가져옵니다.
 * @returns {Promise<DailyMvpResponse>}
 */
export async function fetchDailyMvp() {
  const response = await axios.get('/api/v1/daily-mvp')
  return response.data
}
