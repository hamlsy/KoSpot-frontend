/**
 * Solo 로드뷰 게임 REST API 서비스
 * 
 * 멀티플레이어 개인전(Solo) 게임의 백엔드 API 통신을 처리합니다.
 * - 게임 시작 (첫 라운드 포함)
 * - 정답 제출
 * - 게임방 참여/퇴장
 */

import apiClient from '@/core/api/apiClient'

/**
 * Solo 게임 시작 및 첫 라운드 생성
 * @param {String} roomId - 게임방 ID
 * @param {Object} settings - 게임 설정
 * @param {Number} settings.gameRoomId - 게임방 ID (숫자)
 * @param {Number} settings.totalRounds - 총 라운드 수 (1~10)
 * @param {Number} settings.timeLimit - 라운드 제한 시간 (밀리초, optional)
 * @returns {Promise<Object>} 게임 시작 응답 데이터
 */
export const startSoloGame = async (roomId, settings) => {
  try {
    const response = await apiClient.post(`/rooms/${roomId}/roadview/games/solo`, {
      gameRoomId: settings.gameRoomId,
      playerMatchTypeKey: 'SOLO',
      totalRounds: settings.totalRounds,
      timeLimit: settings.timeLimit || 60000
    })

    if (response.data?.isSuccess) {
      return response.data.result
    } else {
      throw new Error(response.data?.message || '게임 시작 실패')
    }
  } catch (error) {
    console.error('게임 시작 API 오류:', error)
    throw error
  }
}

/**
 * 정답 제출
 * @param {String} roomId - 게임방 ID
 * @param {Number} gameId - 게임 ID
 * @param {Number} roundId - 라운드 ID
 * @param {Object} submission - 제출 데이터
 * @param {Number} submission.lat - 제출한 위도
 * @param {Number} submission.lng - 제출한 경도
 * @param {Number} submission.timeToAnswer - 응답 시간 (밀리초)
 * @returns {Promise<Object>} 제출 응답 데이터
 */
export const submitSoloAnswer = async (roomId, gameId, roundId, submission) => {
  try {
    const response = await apiClient.post(
      `/rooms/${roomId}/games/${gameId}/rounds/${roundId}/submissions/player`,
      {
        lat: submission.lat,
        lng: submission.lng,
        timeToAnswer: submission.timeToAnswer
      }
    )

    if (response.data?.isSuccess) {
      return response.data.result
    } else {
      throw new Error(response.data?.message || '정답 제출 실패')
    }
  } catch (error) {
    console.error('정답 제출 API 오류:', error)
    throw error
  }
}

/**
 * 로드뷰 문제 재발급 요청
 * @param {String|Number} roomId - 게임 방 ID
 * @param {Number} gameId - 게임 ID
 * @param {Number} roundId - 라운드 ID
 * @returns {Promise<Object>} 재발급 응답 데이터
 */
export const reIssueRound = async (roomId, gameId, roundId) => {
  try {
    const response = await apiClient.post(
      `/rooms/${roomId}/roadview/games/${gameId}/rounds/${roundId}/reIssue`
    )

    if (response.data?.isSuccess) {
      return response.data.result
    } else {
      throw new Error(response.data?.message || '로드뷰 재발급 요청 실패')
    }
  } catch (error) {
    console.error('로드뷰 재발급 API 오류:', error)
    throw error
  }
}

/**
 * 게임방 참여
 * @param {String} roomId - 게임방 ID
 * @param {String} password - 비공개 방인 경우 비밀번호 (optional)
 * @returns {Promise<Object>} 참여 응답 데이터
 */
export const joinGameRoom = async (roomId, password = null) => {
  try {
    const response = await apiClient.post(`/rooms/${roomId}/players`, {
      password
    })

    if (response.data?.isSuccess) {
      return response.data.result
    } else {
      throw new Error(response.data?.message || '게임방 참여 실패')
    }
  } catch (error) {
    console.error('게임방 참여 API 오류:', error)
    throw error
  }
}

/**
 * 게임방 퇴장
 * @param {String} roomId - 게임방 ID
 * @returns {Promise<Object>} 퇴장 응답 데이터
 */
export const leaveGameRoom = async (roomId) => {
  try {
    const response = await apiClient.delete(`/rooms/${roomId}/players`)

    if (response.data?.isSuccess) {
      return response.data.result
    } else {
      throw new Error(response.data?.message || '게임방 퇴장 실패')
    }
  } catch (error) {
    console.error('게임방 퇴장 API 오류:', error)
    throw error
  }
}

export default {
  startSoloGame,
  submitSoloAnswer,
  reIssueRound,
  joinGameRoom,
  leaveGameRoom
}

