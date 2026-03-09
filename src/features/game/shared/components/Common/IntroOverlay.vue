<template>
  <!-- 인트로 화면 -->
  <div v-if="showIntro" class="intro-overlay">
    <div class="intro-content">
      <div class="intro-icon" :class="mode">
        <i v-if="mode === 'rank'" class="fas fa-trophy"></i>
        <i v-else class="fas fa-route"></i>
      </div>
      <h2>{{ gameTitle }}</h2>
      <p class="subtitle">{{ gameContent }}</p>
      <p class="description">
        {{ gameDescription }}
      </p>
      <button class="start-btn" :class="mode" @click="endIntro">
        시작하기
      </button>
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
      required: true,
    },
    showIntro: {
      type: Boolean,
      required: true,
      default: true,
    },
    mode: {
      type: String,
      default: "practice", // 'rank' or 'practice'
      validator: (value) => ["rank", "practice"].includes(value),
    },
  },
  methods: {
    endIntro() {
      this.$emit("end-intro");
    },
  },
};
</script>

<style scoped>
/* 배경 오버레이 (투명도 없이 완전한 흰색 배경) */
.intro-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
  z-index: 30; /* PhoneFrame(21)보다 높게 설정 */
}

/* 메인 컨텐츠 카드 (작고 심플하게) */
.intro-content {
  background-color: transparent;
  padding: 0 20px;
  text-align: center;
  max-width: 380px;
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: fadeIn 0.4s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 모드별 아이콘 컨테이너 (부담스럽지 않게 수정) */
.intro-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
  font-size: 20px;
}

/* 약간의 파스텔 톤 배경에 진한 텍스트 컬러 */
.intro-icon.practice {
  background: #f0f9ff;
  color: #3b82f6; 
}

.intro-icon.rank {
  background: #fffbeb;
  color: #f59e0b;
}

/* 타이포그래피 (크기 줄임) */
h2 {
  color: #111827; /* TEXT.PRIMARY */
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.subtitle {
  color: #111827; /* TEXT.PRIMARY */
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 6px;
}

.description {
  color: #6b7280; /* TEXT.SECONDARY */
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 24px;
}

/* 액션 버튼 (얇고 딱딱하지 않게) */
.start-btn {
  color: white;
  border: none;
  padding: 12px 28px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px; /* 알약 형태 대신 둥근 사각형으로 심플하게 */
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  max-width: 160px;
  letter-spacing: 0.02em;
}

/* 심플한 단일 색상 또는 부드러운 그라데이션 */
.start-btn.practice {
  background: #3b82f6;
}

.start-btn.rank {
  background: #f59e0b;
}

/* 마이크로 인터랙션 단축 */
.start-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.start-btn:active {
  transform: translateY(0);
}

/* 반응형 */
@media (max-width: 480px) {
  .intro-content {
    max-width: 320px;
  }

  h2 {
    font-size: 1.3rem;
  }
}
</style>