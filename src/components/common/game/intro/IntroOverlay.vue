<template>
  <!-- 인트로 화면 -->
  <div v-if="showIntro" class="intro-overlay">
    <div class="intro-content">
      <h2>{{ gameTitle }}</h2>
      <p>{{ gameContent }}</p>
      <p>
        {{ gameDescription }}
      </p>
      <button class="start-btn" @click="endIntro">시작하기</button>
    </div>
  </div>
</template>
<script>
export default {
  name: "IntroOverlay",
  props: {
    gameTitle: {
      type: String,
      required: true,
    },
    gameContent: {
      type: String,
      required: true,
    },
    gameDescription: {
        type: String,
        required: true
    },
    showIntro: {
        type: Boolean,
        required: true,
        default: true,
    }
  },
  data() {
    return {
        
    };
  },

  methods: {
    endIntro(){
        this.$emit("end-intro");
    }
  }

};
</script>

<style scoped>
/* 게임 소개 화면 */
.intro-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: whitesmoke;
  z-index: 20;
}

.intro-content {
  background-color: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 500px;
  width: 90%;
}

.start-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 12px 30px;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 25px;
  margin-top: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.4);
}

.start-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(52, 152, 219, 0.6);
}

@media (max-width: 480px) {
  .intro-content {
    padding: 25px;
  }
}
</style>