/**
 * 날짜 문자열을 상대 시간으로 변환합니다.
 * @param {string | Date} dateInput
 * @returns {string} 예: "방금 전", "3분 전", "2시간 전", "5일 전", "3월 15일"
 */
export function formatRelativeTime(dateInput) {
  const now = new Date()
  const date = new Date(dateInput)
  const diffMs = now - date

  if (isNaN(diffMs)) return ''

  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  if (diffHour < 24) return `${diffHour}시간 전`
  if (diffDay < 7) return `${diffDay}일 전`

  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}
