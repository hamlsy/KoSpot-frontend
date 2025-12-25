<template>
  <div class="adsense-container" ref="containerRef">
    <ins 
      class="adsbygoogle"
      ref="adElementRef"
      style="display:block"
      :data-ad-client="client"
      :data-ad-slot="adSlot"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue'

const props = defineProps({
  adSlot: {
    type: String,
    required: true
  },
  client: {
    type: String,
    default: 'ca-pub-7204650236738388'
  }
})

const emit = defineEmits(['ad-loaded'])

const containerRef = ref(null)
const adElementRef = ref(null)
let resizeObserver = null
let checkTimeout = null

// Google AdSense 스크립트 로드
const loadAdSenseScript = () => {
  // 스크립트가 이미 로드되었는지 확인
  if (document.querySelector('script[src*="adsbygoogle.js"]')) {
    return
  }

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + props.client
  script.crossOrigin = 'anonymous'
  document.head.appendChild(script)
}

// 광고 높이 감지 및 이벤트 emit
const checkAdHeight = () => {
  if (!adElementRef.value) return
  
  const height = adElementRef.value.offsetHeight || adElementRef.value.clientHeight
  
  // 높이가 50px 이상이면 광고가 표시된 것으로 간주
  if (height >= 50) {
    emit('ad-loaded', true)
  } else {
    emit('ad-loaded', false)
  }
}

// ResizeObserver로 광고 높이 모니터링
const setupObserver = () => {
  if (!adElementRef.value) return
  
  resizeObserver = new ResizeObserver(() => {
    checkAdHeight()
  })
  
  resizeObserver.observe(adElementRef.value)
  
  // 초기 체크 (2초 후에도 높이가 0이면 광고 없음으로 판단)
  checkTimeout = setTimeout(() => {
    checkAdHeight()
  }, 2000)
}

onMounted(() => {
  // AdSense 스크립트 로드
  loadAdSenseScript()
  
  // 스크립트 로드 후 광고 초기화 (약간의 지연을 주어 스크립트가 완전히 로드되도록)
  setTimeout(() => {
    try {
      if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
        window.adsbygoogle.push({})
      }
    } catch (error) {
      console.error('AdSense 광고 초기화 실패:', error)
    }
    
    // 광고 초기화 후 Observer 설정
    nextTick(() => {
      setupObserver()
    })
  }, 100)
})

onBeforeUnmount(() => {
  // Observer 정리
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  
  // Timeout 정리
  if (checkTimeout) {
    clearTimeout(checkTimeout)
    checkTimeout = null
  }
})
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

