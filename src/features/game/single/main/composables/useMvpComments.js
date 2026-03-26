import { ref, isRef } from 'vue'
import { getMvpComments, postMvpComment, deleteMvpComment } from '../services/mvpComment.service'

/**
 * MVP 댓글 상태 및 비즈니스 로직을 관리하는 컴포저블
 * @param {number | Ref<number>} mvpId
 */
export function useMvpComments(mvpId) {
  const comments = ref([])
  const currentPage = ref(0)
  const hasNext = ref(false)
  const totalElements = ref(0)
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const initialized = ref(false)

  function resolveId() {
    return isRef(mvpId) ? mvpId.value : mvpId
  }

  function extractResult(response) {
    const data = response.data ?? response
    if (data && 'isSuccess' in data) {
      return data.isSuccess ? (data.result ?? null) : null
    }
    return data?.result !== undefined ? data.result : data
  }

  async function fetchPage(page) {
    isLoading.value = true
    try {
      const response = await getMvpComments(resolveId(), page)
      return extractResult(response)
    } finally {
      isLoading.value = false
    }
  }

  /** 첫 로드 (lazy — 중복 호출 무시) */
  async function open() {
    if (initialized.value) return
    const data = await fetchPage(0)
    if (!data) return
    comments.value = data.comments ?? []
    currentPage.value = data.currentPage ?? 0
    hasNext.value = data.hasNext ?? false
    totalElements.value = data.totalElements ?? 0
    initialized.value = true
  }

  /** 다음 페이지 누적 append */
  async function loadMore() {
    if (!hasNext.value || isLoading.value) return
    const nextPage = currentPage.value + 1
    const data = await fetchPage(nextPage)
    if (!data) return
    comments.value.push(...(data.comments ?? []))
    currentPage.value = data.currentPage ?? nextPage
    hasNext.value = data.hasNext ?? false
    totalElements.value = data.totalElements ?? totalElements.value
  }

  /** 댓글 작성 → 목록 맨 앞에 추가 */
  async function addComment(content) {
    if (isSubmitting.value) return
    isSubmitting.value = true
    try {
      const response = await postMvpComment(resolveId(), content)
      const newComment = extractResult(response)
      if (newComment) {
        comments.value.unshift(newComment)
        totalElements.value++
      }
    } finally {
      isSubmitting.value = false
    }
  }

  /** 댓글 삭제 → 낙관적 제거 후 실패 시 복원 */
  async function removeComment(commentId) {
    const index = comments.value.findIndex(c => c.commentId === commentId)
    if (index === -1) return

    const removed = comments.value.splice(index, 1)[0]
    totalElements.value--

    try {
      await deleteMvpComment(commentId)
    } catch (e) {
      // 실패 시 원래 위치로 복원
      comments.value.splice(index, 0, removed)
      totalElements.value++
      if (e.response?.status === 403) {
        alert('댓글 삭제 권한이 없습니다.')
      }
    }
  }

  return {
    comments,
    isLoading,
    hasNext,
    totalElements,
    isSubmitting,
    initialized,
    open,
    loadMore,
    addComment,
    removeComment,
  }
}
