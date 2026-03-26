<template>
  <div class="comment-section">
    <MvpCommentToggle :comment-count="displayCount" :is-open="isOpen" @toggle="handleToggle" />
    <!-- v-if 대신 CSS max-height 트랜지션 사용 — Vue Transition + reactive unshift 충돌 방지 -->
    <div class="comment-area" :class="{ 'comment-area--open': isOpen }">
      <MvpCommentList
        :comments="comments"
        :is-loading="isLoading"
        :has-next="hasNext"
        :current-nickname="currentNickname"
        @delete="removeComment"
        @load-more="loadMore"
      />
      <div class="divider"></div>
      <MvpCommentInput
        :is-logged-in="isLoggedIn"
        :is-submitting="isSubmitting"
        @submit="addComment"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '@/core/composables/useAuth'
import MvpCommentToggle from './MvpCommentToggle.vue'
import MvpCommentList from './MvpCommentList.vue'
import MvpCommentInput from './MvpCommentInput.vue'
import { useMvpComments } from '../../composables/useMvpComments'

const props = defineProps({
  mvpId: { type: Number, required: true },
  commentCount: { type: Number, default: 0 },
})

const { user } = useAuth()
const isOpen = ref(false)

const isLoggedIn = computed(() => !!localStorage.getItem('accessToken'))

// checkAuth() 실행 후 user에는 MEMBER.PROFILE 전체 응답(nickname 포함)이 저장됨
const currentNickname = computed(() => user.value?.nickname ?? null)

const {
  comments, isLoading, hasNext, totalElements,
  isSubmitting, initialized,
  open, loadMore, addComment, removeComment,
} = useMvpComments(props.mvpId)

const displayCount = computed(() =>
  initialized.value ? totalElements.value : props.commentCount
)

async function handleToggle() {
  isOpen.value = !isOpen.value
  if (isOpen.value) await open()
}
</script>

<style scoped>
.comment-section {
  width: 100%;
}

.comment-area {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.3s ease, opacity 0.25s ease;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 20px 20px;
  padding: 0 1.25rem;
}

.comment-area--open {
  max-height: 600px;
  opacity: 1;
  padding: 1rem 1.25rem;
}

.divider {
  height: 1px;
  background: #f1f5f9;
  margin: 0.25rem 0;
}
</style>
