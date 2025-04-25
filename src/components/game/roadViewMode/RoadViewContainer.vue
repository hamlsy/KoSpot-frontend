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

<script>
import RoadViewPracticeComponent from "./components/RoadViewPractice.vue";
import RoadViewRankComponent from "./components/RoadViewRank.vue";

export default {
  name: "RoadViewContainer",
  components: {
    RoadViewPracticeComponent,
    RoadViewRankComponent
  },
  props: {
    isRankMode: {
      type: Boolean,
      default: false,
    },
    region: {
      type: String,
      default: "서울",
    },
  }
};
</script>

<style scoped>
.road-view-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
