<template>
  <div class="comment-section">
    <MvpCommentToggle
      :comment-count="displayCount"
      :is-open="isOpen"
      @toggle="handleToggle"
    />
    <Transition name="slide">
      <div v-if="isOpen" class="comment-area">
        <MvpCommentList
          :comments="comments"
          :is-loading="isLoading"
          :has-next="hasNext"
          :current-nickname="currentNickname"
          @delete="removeComment"
          @load-more="loadMore"
        />
        <div class="divider" />
        <MvpCommentInput
          :is-logged-in="isLoggedIn"
          :is-submitting="isSubmitting"
          @submit="addComment"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import MvpCommentToggle from './MvpCommentToggle.vue'
import MvpCommentList from './MvpCommentList.vue'
import MvpCommentInput from './MvpCommentInput.vue'
import { useMvpComments } from '../../composables/useMvpComments'

const props = defineProps({
  mvpId: { type: Number, required: true },
  commentCount: { type: Number, default: 0 },
})

const store = useStore()
const isOpen = ref(false)

const isLoggedIn = computed(() => !!localStorage.getItem('accessToken'))
const currentNickname = computed(
  () => store.state.user.profile?.nickname ?? store.state.auth.user?.nickname ?? null
)

const {
  comments, isLoading, hasNext, totalElements,
  isSubmitting, initialized,
  open, loadMore, addComment, removeComment,
} = useMvpComments(props.mvpId)

// 로드 전: props의 commentCount, 로드 후: 실제 totalElements
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
  padding: 1rem 1.25rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 20px 20px;
}

.divider {
  height: 1px;
  background: #f1f5f9;
  margin: 0.25rem 0;
}

/* ─── Slide 트랜지션 ─── */
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
  transform-origin: top;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: scaleY(0.96) translateY(-4px);
}
</style>
