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
        <span class="btn-text">시작하기</span>
        <i class="fas fa-arrow-right btn-icon"></i>
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
/* 배경 오버레이 - 글래스모피즘 적용 */
.intro-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(243, 244, 246, 0.4); /* BACKGROUND.GRAY with opacity */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 30; /* PhoneFrame(21)보다 높게 설정 */
}

/* 메인 컨텐츠 카드 */
.intro-content {
  background-color: rgba(255, 255, 255, 0.95);
  padding: 40px 30px;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.5);
  text-align: center;
  max-width: 480px;
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 모드별 아이콘 컨테이너 */
.intro-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  font-size: 28px;
  color: white;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.intro-icon.practice {
  background: linear-gradient(135deg, #33fbe8 0%, #3b82f6 100%); /* PRIMARY to INFO */
}

.intro-icon.rank {
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); /* SECONDARY to DANGER */
}

/* 타이포그래피 */
h2 {
  color: #111827; /* TEXT.PRIMARY */
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

.subtitle {
  color: #111827; /* TEXT.PRIMARY */
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.description {
  color: #6b7280; /* TEXT.SECONDARY */
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 32px;
}

/* 액션 버튼 */
.start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: white;
  border: none;
  padding: 16px 36px;
  font-size: 1.1rem;
  font-weight: 700;
  border-radius: 100px; /* 완전한 알약 형태 */
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  width: 100%;
  max-width: 240px;
  letter-spacing: 0.02em;
}

.btn-icon {
  font-size: 1rem;
  transition: transform 0.3s ease;
}

/* 모드별 버튼 스타일 */
.start-btn.practice {
  background: linear-gradient(135deg, #33fbe8 0%, #3b82f6 100%); /* PRIMARY to INFO */
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

.start-btn.rank {
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); /* SECONDARY to DANGER */
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);
}

/* 마이크로 인터랙션 */
.start-btn:hover {
  transform: translateY(-3px);
  filter: brightness(1.05);
}

.start-btn.practice:hover {
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.4);
}

.start-btn.rank:hover {
  box-shadow: 0 12px 24px rgba(239, 68, 68, 0.4);
}

.start-btn:hover .btn-icon {
  transform: translateX(4px);
}

.start-btn:active {
  transform: translateY(1px);
}

/* 반응형 */
@media (max-width: 480px) {
  .intro-content {
    padding: 32px 24px;
    width: 85%;
  }

  h2 {
    font-size: 1.5rem;
  }
  
  .intro-icon {
    width: 56px;
    height: 56px;
    font-size: 24px;
  }
}
</style>