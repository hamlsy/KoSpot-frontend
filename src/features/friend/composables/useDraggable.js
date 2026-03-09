/**
 * useDraggable - 친구 채팅창 드래그 Composable
 *
 * - Pointer Events API 하나로 마우스 + 터치 통합 처리
 * - setPointerCapture 로 창 밖으로 드래그해도 끊기지 않음
 * - transform: translate3d 만 사용 → Compositor Thread 처리, layout reflow Zero
 * - 화면 경계 clamp 로 창이 뷰포트 밖으로 나가지 않음
 *
 * @param {import('vue').Ref<HTMLElement|null>} elementRef - 창 루트 엘리먼트 ref
 * @param {{ x: number, y: number }} initial - 초기 위치 (px)
 * @returns {{ x, y, isDragging, dragHandleListeners }}
 */
import { ref, onUnmounted } from 'vue'

export function useDraggable(elementRef, initial = { x: 0, y: 0 }) {
    const x = ref(initial.x)
    const y = ref(initial.y)
    const isDragging = ref(false)

    // 드래그 시작 시점의 포인터 vs 창 좌표 오프셋
    let startPointerX = 0
    let startPointerY = 0
    let startX = 0
    let startY = 0

    // pointermove / pointerup 리스너 레퍼런스 (정리용)
    let activeTarget = null

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value))
    }

    function getViewportConstraints(el) {
        if (!el) return { maxX: 9999, maxY: 9999 }
        const rect = el.getBoundingClientRect()
        return {
            maxX: window.innerWidth - rect.width,
            maxY: window.innerHeight - rect.height,
        }
    }

    function onPointerDown(event) {
        // 버튼 클릭 등 상호작용 요소 예외 처리
        if (event.target.closest('button') || event.target.closest('a')) return
        // 모바일(≤480px)에서는 드래그 비활성화 - Bottom Sheet 모드
        if (window.innerWidth <= 480) return
        // 좌클릭(마우스) 또는 터치만 허용
        if (event.button !== undefined && event.button !== 0) return

        isDragging.value = true
        startPointerX = event.clientX
        startPointerY = event.clientY
        startX = x.value
        startY = y.value

        // Pointer Capture: 창 밖으로 나가도 이벤트 추적
        event.currentTarget.setPointerCapture(event.pointerId)
        activeTarget = event.currentTarget

        activeTarget.addEventListener('pointermove', onPointerMove)
        activeTarget.addEventListener('pointerup', onPointerUp)
        activeTarget.addEventListener('pointercancel', onPointerUp)
    }

    function onPointerMove(event) {
        if (!isDragging.value) return

        const dx = event.clientX - startPointerX
        const dy = event.clientY - startPointerY

        const el = elementRef.value
        const { maxX, maxY } = getViewportConstraints(el)

        x.value = clamp(startX + dx, 0, maxX)
        y.value = clamp(startY + dy, 0, maxY)
    }

    function onPointerUp(event) {
        if (!isDragging.value) return
        isDragging.value = false

        if (activeTarget) {
            activeTarget.removeEventListener('pointermove', onPointerMove)
            activeTarget.removeEventListener('pointerup', onPointerUp)
            activeTarget.removeEventListener('pointercancel', onPointerUp)
            try {
                activeTarget.releasePointerCapture(event.pointerId)
            } catch (_) { /* 이미 해제된 경우 무시 */ }
            activeTarget = null
        }
    }

    onUnmounted(() => {
        if (activeTarget) {
            activeTarget.removeEventListener('pointermove', onPointerMove)
            activeTarget.removeEventListener('pointerup', onPointerUp)
            activeTarget.removeEventListener('pointercancel', onPointerUp)
        }
    })

    /**
     * 헤더 엘리먼트에 v-bind 로 바인딩
     * <div class="chat-header" v-bind="dragHandleListeners">
     */
    const dragHandleListeners = {
        onPointerdown: onPointerDown,
    }

    return {
        x,
        y,
        isDragging,
        dragHandleListeners,
    }
}
