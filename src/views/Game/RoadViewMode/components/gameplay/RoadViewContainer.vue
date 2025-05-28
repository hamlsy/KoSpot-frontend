<!-- 로드뷰 게임 컨테이너 컴포넌트 -->
<template>
  <div class="road-view-container">
    <!-- 연습 모드 -->
    <RoadViewPracticeComponent 
      v-if="!isRankMode"
      :region="region"
      @exit="$emit('exit')"
    />
    
    <!-- 랭크 모드 -->
    <RoadViewRankComponent 
      v-else
      :region="region"
      @exit="$emit('exit')"
    />
  </div>
</template>

<script setup>
// Vue 3 Composition API 방식으로 변경
import RoadViewPracticeComponent from "@/views/Game/RoadViewMode/components/gameplay/RoadViewPractice.vue";
import RoadViewRankComponent from "@/views/Game/RoadViewMode/components/gameplay/RoadViewRank.vue";

// props 정의
defineProps({
  isRankMode: {
    type: Boolean,
    default: false,
  },
  region: {
    type: String,
    default: "서울",
  },
});

// 이벤트 정의
defineEmits(['exit']);
</script>

<style scoped>
.road-view-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
