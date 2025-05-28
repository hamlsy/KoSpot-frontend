<template>
  <!-- 멀티플레이어 인트로 화면 -->
  <transition name="fade">
    <div v-if="showIntro" class="intro-overlay">
      <div class="intro-content">
        <transition name="slide-fade" mode="out-in">
          <h2 v-if="step === 1" key="step1">게임을 시작합니다.</h2>
          <h2 v-else-if="step === 2" key="step2">준비되셨나요?</h2>
          <h2 v-else-if="step === 3" key="step3">{{ currentRound }}라운드</h2>
          <div v-else-if="step === 4" key="step4" class="countdown-container">
            <span class="countdown-number">{{ countdown }}</span>
          </div>
        </transition>
      </div>
    </div>
  </transition>
</template>

<script>
import gameStore from "@/store/gameStore";

export default {
  name: "MultiplayerIntroOverlay",
  props: {
    currentRound: {
      type: Number,
      required: true,
      default: 1,
    },
    showIntro: {
      type: Boolean,
      required: true,
      default: true,
    },
    roomId: {
      type: String,
      default: "",
    },
    serverStartTime: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      step: 1,
      countdown: 3,
      timer: null,
      stepTimers: [],
      syncTimer: null,
      localStartTime: 0,
      timeOffset: 0,
      gameStore,
    };
  },
  mounted() {
    // 서버 시간과 로컬 시간의 차이 계산
    if (this.serverStartTime > 0) {
      this.syncWithServerTime();
    } else {
      // 서버 시간이 없는 경우 로컬 시작
      this.startIntroSequence();
    }
  },
  beforeDestroy() {
    this.clearAllTimers();
  },
  methods: {
    // 서버 시간과 동기화
    syncWithServerTime() {
      this.localStartTime = Date.now();
      this.timeOffset = this.serverStartTime - this.localStartTime;
      console.log(`서버 시간 오프셋: ${this.timeOffset}ms`);

      // 서버 시간을 기준으로 인트로 시퀀스 시작
      this.startSyncedIntroSequence();
    },

    // 서버 시간과 동기화된 인트로 시퀀스
    startSyncedIntroSequence() {
      // 서버 시간과 현재 시간의 차이 계산
      const now = Date.now();
      const elapsedSinceStart = now - (this.serverStartTime - this.timeOffset);

      // 이미 시간이 지났다면 해당 단계로 직접 이동
      if (elapsedSinceStart >= 4500) {
        // 카운트다운 단계
        this.step = 4;
        const remainingTime = 7500 - elapsedSinceStart;
        if (remainingTime > 0) {
          // 남은 카운트다운 시간 계산
          this.countdown = Math.ceil(remainingTime / 1000);
          this.startCountdown();
        } else {
          // 이미 끝났으면 바로 완료
          this.$emit("intro-complete");
        }
      } else if (elapsedSinceStart >= 3000) {
        // 라운드 번호 단계
        this.step = 3;
        this.scheduleNextStep(4500 - elapsedSinceStart);
      } else if (elapsedSinceStart >= 1500) {
        // "준비되셨나요?" 단계
        this.step = 2;
        this.scheduleNextStep(3000 - elapsedSinceStart);
      } else {
        // 처음 단계
        this.step = 1;
        this.scheduleNextStep(1500 - elapsedSinceStart);
      }
    },

    // 다음 단계 스케줄링
    scheduleNextStep(delay) {
      const timer = setTimeout(() => {
        this.step++;
        if (this.step === 4) {
          this.startCountdown();
        }
      }, delay);
      this.stepTimers.push(timer);
    },

    // 로컬 시작용 인트로 시퀀스 (서버 연결 없을 때 사용)
    startIntroSequence() {
      // 첫 번째 단계: "게임을 시작합니다."
      const timer1 = setTimeout(() => {
        // 두 번째 단계: "준비되셨나요?"
        this.step = 2;

        const timer2 = setTimeout(() => {
          // 세 번째 단계: "n라운드"
          this.step = 3;

          const timer3 = setTimeout(() => {
            // 네 번째 단계: 카운트다운 "3, 2, 1"
            this.step = 4;
            this.startCountdown();
          }, 1500);
          this.stepTimers.push(timer3);
        }, 1500);
        this.stepTimers.push(timer2);
      }, 1500);
      this.stepTimers.push(timer1);

      // 서버 구현 시 여기에 소켓 이벤트 전송 코드 추가
    },

    startCountdown() {
      this.countdown = 3;

      this.clearTimer(this.timer);
      setTimeout(() => {
        this.timer = setInterval(() => {
          this.countdown--;

          if (this.countdown <= 0) {
            this.clearAllTimers();
            this.$emit("intro-complete");
          }
        }, 1000);
      }, 200);
    },

    clearTimer(timer) {
      if (timer) {
        clearInterval(timer);
        clearTimeout(timer);
      }
    },

    clearAllTimers() {
      // 카운트다운 타이머 정리
      this.clearTimer(this.timer);
      this.timer = null;

      // 단계 타이머들 정리
      this.stepTimers.forEach((timer) => {
        this.clearTimer(timer);
      });
      this.stepTimers = [];

      // 동기화 타이머 정리
      this.clearTimer(this.syncTimer);
      this.syncTimer = null;
    },
  },
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
  background-color: white;
  z-index: 100;
  /* 중앙 패널 내에서만 작동하도록 설정 */
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.intro-content {
  text-align: center;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.intro-content h2 {
  font-size: 3rem;
  font-weight: bold;
  color: black;
}

.countdown-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.countdown-number {
  font-size: 5rem;
  font-weight: bold;
  color: black;
  transition: none; /* 트랜지션 효과 제거 */
}

/* 페이드 트랜지션 (오버레이 전체) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

/* 슬라이드 페이드 트랜지션 (텍스트) */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.5s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

@media (max-width: 768px) {
  .intro-content h2 {
    font-size: 2.5rem;
  }
}

@media (max-width: 480px) {
  .intro-content h2 {
    font-size: 2rem;
  }
}
</style>
