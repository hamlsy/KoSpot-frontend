/**
 * 카카오 맵 API 플러그인
 * 카카오 맵 SDK를 전역적으로 관리하고 초기화하는 플러그인입니다.
 */

// 카카오 맵 로드 상태 관리
let isLoaded = false;
let isLoading = false;
let loadCallbacks = [];

/**
 * 카카오 맵 SDK가 로드되었는지 확인
 * @returns {boolean} 로드 여부
 */
export const isKakaoMapLoaded = () => isLoaded;

/**
 * 카카오 맵 SDK 로드 완료 후 콜백 실행
 * @param {Function} callback 실행할 콜백 함수
 */
export const onKakaoMapLoaded = (callback) => {
  if (isLoaded) {
    callback(window.kakao);
  } else {
    loadCallbacks.push(callback);
  }
};

/**
 * 카카오 맵 SDK 초기화
 * @param {Object} options 초기화 옵션
 * @param {string} options.appKey 카카오 맵 앱키 (필수)
 * @param {string} options.libraries 사용할 라이브러리 (선택)
 * @returns {Promise} 초기화 완료 Promise
 */
export const initializeKakaoMaps = (options = {}) => {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우
    if (isLoaded) {
      resolve(window.kakao);
      return;
    }

    // 로드 중인 경우
    if (isLoading) {
      onKakaoMapLoaded(resolve);
      return;
    }

    // 필수 옵션 확인
    if (!options.appKey) {
      reject(new Error('카카오 맵 앱키가 필요합니다.'));
      return;
    }

    isLoading = true;

    // 카카오 맵 SDK 로드 완료 이벤트 핸들러
    const onLoad = () => {
      isLoaded = true;
      isLoading = false;
      
      // 콜백 실행
      loadCallbacks.forEach(callback => callback(window.kakao));
      loadCallbacks = [];
      
      resolve(window.kakao);
    };

    // 이미 스크립트가 존재하는지 확인
    const existingScript = document.getElementById('kakao-maps-sdk');
    if (existingScript) {
      // 이미 스크립트가 있으면 로드 이벤트 리스너 추가
      existingScript.addEventListener('load', onLoad);
      return;
    }

    // 스크립트 생성
    const script = document.createElement('script');
    script.id = 'kakao-maps-sdk';
    script.async = true;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${options.appKey}${
      options.libraries ? `&libraries=${options.libraries}` : ''
    }`;
    
    // 로드 이벤트 리스너 추가
    script.addEventListener('load', onLoad);
    
    // 에러 처리
    script.addEventListener('error', (error) => {
      isLoading = false;
      reject(new Error('카카오 맵 SDK 로드 실패: ' + error.message));
    });
    
    // 문서에 스크립트 추가
    document.head.appendChild(script);
  });
};

/**
 * 카카오 맵 Vue 플러그인
 * @param {Object} app Vue 앱 인스턴스
 * @param {Object} options 플러그인 옵션
 */
export const KakaoMapsPlugin = {
  install(app, options = {}) {
    // 전역 속성 설정
    app.config.globalProperties.$kakaoMaps = {
      isLoaded: isKakaoMapLoaded,
      onLoaded: onKakaoMapLoaded,
      initialize: initializeKakaoMaps,
    };

    // Composition API를 위한 provide/inject 설정
    app.provide('kakaoMaps', {
      isLoaded: isKakaoMapLoaded,
      onLoaded: onKakaoMapLoaded,
      initialize: initializeKakaoMaps,
    });

    // 자동 초기화 (옵션에 appKey가 있는 경우)
    if (options.appKey) {
      initializeKakaoMaps(options)
        .catch(error => console.error('카카오 맵 초기화 실패:', error));
    }
  }
};

// Composition API를 위한 훅
export const useKakaoMaps = () => {
  return {
    isLoaded: isKakaoMapLoaded,
    onLoaded: onKakaoMapLoaded,
    initialize: initializeKakaoMaps,
    
    // 카카오 맵 인스턴스 가져오기 (로드된 경우에만)
    getKakao: () => isLoaded ? window.kakao : null,
  };
};

export default KakaoMapsPlugin;
