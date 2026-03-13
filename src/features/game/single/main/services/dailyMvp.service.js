import axios from 'axios'
import apiClient from '@/core/api/apiClient';

//  GET_MVP_ENDPOINT = '/mvps/daily'
const GET_MVP_ENDPOINT = '/mvps/daily/today-with-yesterday'

/**
 * 오늘의 MVP 정보를 가져옵니다.
 * @returns {Promise<DailyMvpResponse>}
 */
export async function fetchDailyMvp() {
  return apiClient.get(GET_MVP_ENDPOINT);
}
