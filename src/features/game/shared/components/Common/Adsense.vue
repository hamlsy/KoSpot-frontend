<template>
  <div class="adsense-container">
    <ins 
      class="adsbygoogle"
      style="display:block"
      :data-ad-client="client"
      :data-ad-slot="adSlot"
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'

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
  }, 100)
})

onBeforeUnmount(() => {
  // 컴포넌트 언마운트 시 정리 작업 (필요시)
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

