<template>
  <div class="adsense-container" ref="containerRef">
    <ins
      class="adsbygoogle"
      ref="adElementRef"
      style="display: block"
      :data-ad-client="client"
      :data-ad-slot="adSlot"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, nextTick } from "vue";

const props = defineProps({
  adSlot: {
    type: String,
    required: true,
  },
  client: {
    type: String,
    default: "ca-pub-7204650236738388",
  },
});

const emit = defineEmits(["ad-loaded"]);

const containerRef = ref(null);
const adElementRef = ref(null);
let resizeObserver = null;
let checkTimeout = null;

// 스크립트 로드 완료 보장 (Promise 기반)
const ensureScriptLoaded = () => {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우 즉시 resolve
    if (window.adsbygoogle) {
      return resolve();
    }

    // 기존 스크립트 태그가 있으면 onload 대기
    const existing = document.querySelector('script[src*="adsbygoogle.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    // 새로 삽입하고 onload 대기
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${props.client}`;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// 레이아웃 폭 체크
const hasWidth = (el) => {
  if (!el) return false;
  return el.getBoundingClientRect().width > 0;
};

// 광고 높이 감지 및 이벤트 emit
const checkAdHeight = () => {
  if (!adElementRef.value) return;

  const height =
    adElementRef.value.offsetHeight || adElementRef.value.clientHeight;

  // 높이가 50px 이상이면 광고가 표시된 것으로 간주
  if (height >= 50) {
    emit("ad-loaded", true);
  } else {
    emit("ad-loaded", false);
  }
};

// ResizeObserver로 광고 높이 모니터링
const setupObserver = () => {
  if (!adElementRef.value) return;

  resizeObserver = new ResizeObserver(() => {
    checkAdHeight();
  });

  resizeObserver.observe(adElementRef.value);

  // 초기 체크 (500ms 후에도 높이가 0이면 광고 없음으로 판단)
  checkTimeout = setTimeout(() => {
    checkAdHeight();
  }, 500);
};

// 광고 요청 함수
const requestAd = async () => {
  try {
    // 1. 스크립트 로드 완료 보장
    await ensureScriptLoaded();
    await nextTick();

    // 2. 레이아웃 폭이 0인 경우 재시도 (최대 10회, 50ms 간격)
    let tries = 0;
    while (!hasWidth(adElementRef.value) && tries < 10) {
      await new Promise((r) => setTimeout(r, 50));
      tries++;
    }

    // 3. push 실행 (조건문 제거, 무조건 실행)
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("AdSense 광고 초기화 실패:", error);
    }

    // 4. 광고 초기화 후 Observer 설정
    await nextTick();
    setupObserver();
  } catch (error) {
    console.error("AdSense 스크립트 로드 실패:", error);
    // 스크립트 로드 실패 시에도 Observer는 설정 (나중에 로드될 수 있음)
    await nextTick();
    setupObserver();
  }
};

onMounted(() => {
  requestAd();
});

onBeforeUnmount(() => {
  // Observer 정리
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  // Timeout 정리
  if (checkTimeout) {
    clearTimeout(checkTimeout);
    checkTimeout = null;
  }
});
</script>

<style scoped>
.adsense-container {
  width: 100%;
  margin: 0 auto;
  text-align: center;
  overflow: hidden;
}

/* AdSense 광고 영역 스타일링 */
.adsbygoogle {
  display: block !important;
  width: 100%;
  min-height: 90px;
}

/* data-ad-status="unfilled" 숨기기 */
ins.adsbygoogle[data-ad-status="unfilled"] {
  display: none !important;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .adsense-container {
    min-height: 100px;
  }

  .adsbygoogle {
    min-height: 100px;
  }
}

@media (max-width: 480px) {
  .adsense-container {
    min-height: 50px;
  }

  .adsbygoogle {
    min-height: 50px;
  }
}
</style>
