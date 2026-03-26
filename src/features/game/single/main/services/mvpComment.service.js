import apiClient from '@/core/api/apiClient'

/**
 * MVP 댓글 목록 조회 (최신순, 8개 페이징)
 * @param {number} mvpId
 * @param {number} page - 0부터 시작
 */
export function getMvpComments(mvpId, page = 0) {
  return apiClient.get(`/mvps/${mvpId}/comments`, { params: { page } })
}

/**
 * MVP 댓글 작성
 * @param {number} mvpId
 * @param {string} content - 최대 300자
 */
export function postMvpComment(mvpId, content) {
  return apiClient.post(`/mvps/${mvpId}/comments`, { content })
}

/**
 * MVP 댓글 삭제 (본인 또는 관리자)
 * @param {number} commentId
 */
export function deleteMvpComment(commentId) {
  return apiClient.delete(`/mvps/comments/${commentId}`)
}
