<!-- src/views/ComponentTest.vue -->
<template>
  <div class="test-container">
    <h1>컴포넌트 테스트 페이지</h1>
    
    <VoteOverlay
        :approvedVotes="testVotes"
        :totalTeamMembers="4"
        :isInitiator="true"
      />
   
    <div class="test-section">
      <h2>VoteOverlay 테스트</h2>
      <VoteOverlay
        :approvedVotes="testVotes"
        :totalTeamMembers="4"
        :isInitiator="false"
      />
    </div>
  </div>
</template>
  
  <script>
import VoteOverlay from "@/features/game/shared/components/Kakao/VoteOverlay.vue";

export default {
  components: { VoteOverlay },
  data() {
    return {
      testVotes: [
        { id: "player1", nickname: "테스트유저1" },
        { id: "player2", nickname: "테스트유저2" },
      ],
    };
  },
};
</script>