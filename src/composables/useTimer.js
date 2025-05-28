import { ref, onUnmounted } from 'vue';

/**
 * 타이머 기능을 제공하는 컴포저블
 * @param {Object} options - 타이머 옵션
 * @returns {Object} - 타이머 관련 상태 및 메서드
 */
export default function useTimer(options = {}) {
  const time = ref(options.initialTime || 0);
  const isRunning = ref(false);
  const intervalId = ref(null);

  // 타이머 시작
  const start = (duration = options.duration) => {
    if (isRunning.value) return;
    
    time.value = duration || time.value;
    isRunning.value = true;
    
    intervalId.value = setInterval(() => {
      if (time.value <= 0) {
        stop();
        if (options.onFinish) options.onFinish();
        return;
      }
      
      time.value--;
      if (options.onTick) options.onTick(time.value);
    }, 1000);
  };

  // 타이머 일시정지
  const pause = () => {
    if (!isRunning.value) return;
    
    clearInterval(intervalId.value);
    isRunning.value = false;
  };

  // 타이머 재개
  const resume = () => {
    if (isRunning.value) return;
    
    isRunning.value = true;
    intervalId.value = setInterval(() => {
      if (time.value <= 0) {
        stop();
        if (options.onFinish) options.onFinish();
        return;
      }
      
      time.value--;
      if (options.onTick) options.onTick(time.value);
    }, 1000);
  };

  // 타이머 정지
  const stop = () => {
    clearInterval(intervalId.value);
    isRunning.value = false;
  };

  // 타이머 리셋
  const reset = (newTime = options.initialTime || 0) => {
    stop();
    time.value = newTime;
  };

  // 시간 포맷팅 (mm:ss)
  const formatTime = (seconds = time.value) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 컴포넌트 언마운트 시 타이머 정리
  onUnmounted(() => {
    stop();
  });

  return {
    time,
    isRunning,
    start,
    pause,
    resume,
    stop,
    reset,
    formatTime
  };
}
