import { ref, readonly } from "vue";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";

/**
 * WebSocket 코어 기능
 * 연결, 구독, 발행 등 기본적인 WebSocket 기능을 제공합니다.
 */

// 상태 변수
const stompClient = ref(null);
const isConnected = ref(false);
const activeSubscriptions = ref(new Map());
const connectionCallbacks = ref(new Set());

/**
 * WebSocket 서버에 연결
 * @param {String} endpoint - WebSocket 서버 엔드포인트
 * @param {Function} onConnectCallback - 연결 성공 시 실행할 콜백 함수
 */
const connect = (endpoint = "/ws", onConnectCallback = null) => {
  // 기존 연결이 있는 경우 정리 (새로고침 시 중복 연결 방지)
  if (stompClient.value && !isConnected.value) {
    try {
      stompClient.value.disconnect();
    } catch (error) {
      console.error("기존 연결 정리 중 오류:", error);
    }
    stompClient.value = null;
  }

  // 이미 연결된 경우, 콜백만 등록하고 종료
  if (isConnected.value) {
    if (onConnectCallback) {
      connectionCallbacks.value.add(onConnectCallback);
      // 이미 연결되어 있으므로 즉시 콜백 실행
      onConnectCallback();
    }
    return;
  }

  // 연결 시도 중인 경우, 콜백만 등록
  if (stompClient.value) {
    if (onConnectCallback) {
      connectionCallbacks.value.add(onConnectCallback);
    }
    return;
  }

  try {
    // WebSocket URL 구성
    let wsUrl;
    // endpoint 정규화: 항상 "/"로 시작
    const normalizedEndpoint = endpoint?.startsWith("/")
      ? endpoint
      : `/${endpoint || ""}`;

    if (process.env.NODE_ENV === "development") {
      // 개발 환경: localhost:8080 사용
      wsUrl = `${process.env.VUE_APP_WS_URL}${endpoint}`;
      console.log("🔵 개발 환경 WebSocket URL:", wsUrl);
      console.log(process.env.VUE_APP_WS_URL)
    } else {
      // 프로덕션 환경: 환경 변수 또는 현재 호스트 사용
      if (process.env.VUE_APP_WS_URL) {
        wsUrl = `${process.env.VUE_APP_WS_URL}${endpoint}`;
      } else {
        // 환경 변수가 없으면 현재 페이지의 호스트 사용
        wsUrl = `${window.location.protocol}//${window.location.host}${normalizedEndpoint}`;
      }
    }


    // SockJS 설정 옵션 
    const sockjsOptions = {
      timeout: 10000, // 10초 타임아웃
      transports: ["websocket", "xhr-polling", "jsonp-polling"],
    };


    const socket = new SockJS(wsUrl, undefined, sockjsOptions);
    
    console.log("🔵 SockJS 인스턴스 생성 완료:", {
      wsUrl: wsUrl,
      readyState: socket.readyState,
      protocol: socket.protocol,
      timestamp: new Date().toISOString()
    });

    // SockJS 이벤트 리스너 추가
    socket.onclose = function (event) {
      console.log("🔴 SockJS onclose 이벤트 발생:", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        target: event.target,
        type: event.type,
        currentURL: event.target?.url || wsUrl,
        readyState: event.target?.readyState,
        isConnected: isConnected.value,
        timestamp: new Date().toISOString()
      });
      
      // SockJS 연결 실패 시 즉시 더미 모드로 전환
      if (!isConnected.value) {
        console.warn("⚠️ SockJS 연결이 완료되지 않은 상태에서 종료됨");
        console.log("📊 연결 상태 상세:", {
          isConnected: isConnected.value,
          hasStompClient: !!stompClient.value,
          endpoint: endpoint,
          wsUrl: wsUrl,
          connectionCallbacksCount: connectionCallbacks.value.size
        });
        
        stompClient.value = null;

        // 등록된 콜백들을 더미 모드로 실행
        connectionCallbacks.value.forEach((callback) => {
          try {
            callback();
          } catch (error) {
            console.error("SockJS 실패 콜백 실행 중 오류:", error);
          }
        });
      }
    };

    socket.onerror = function (error) {
      console.error("🔴 SockJS onerror 이벤트 발생:", {
        error: error,
        errorType: error?.type,
        errorTarget: error?.target,
        errorMessage: error?.message,
        currentURL: error?.target?.url || wsUrl,
        readyState: error?.target?.readyState,
        isConnected: isConnected.value,
        timestamp: new Date().toISOString()
      });
      
      // 추가 에러 정보 수집
      if (error?.target) {
        console.error("📋 SockJS 에러 타겟 상세:", {
          url: error.target.url,
          readyState: error.target.readyState,
          protocol: error.target.protocol,
          extensions: error.target.extensions
        });
      }
      
      // SockJS 오류 시 즉시 더미 모드로 전환
      if (!isConnected.value) {
        console.warn("⚠️ SockJS 연결 오류로 인해 더미 모드로 전환");
        stompClient.value = null;

        // 등록된 콜백들을 더미 모드로 실행
        connectionCallbacks.value.forEach((callback) => {
          try {
            callback();
          } catch (error) {
            console.error("SockJS 오류 콜백 실행 중 오류:", error);
          }
        });
      }
    };
    
    // SockJS 연결 상태 변화 추적
    socket.onopen = function (event) {
      
    };
    
    // SockJS 메시지 이벤트 (디버깅용)
    socket.onmessage = function (event) {
      console.log("📨 SockJS 메시지 수신:", {
        data: event.data,
        type: event.type,
        timestamp: new Date().toISOString()
      });
    };

    stompClient.value = Stomp.over(socket);

    // 콜백 등록
    if (onConnectCallback) {
      connectionCallbacks.value.add(onConnectCallback);
    }

    // STOMP 클라이언트 디버깅 비활성화 (프로덕션에서)
    if (process.env.NODE_ENV === "development") {
      stompClient.value.debug = function (str) {
        // console.log("STOMP:", str);
      };
    } else {
      stompClient.value.debug = function () {}; // 디버깅 비활성화
    }

    //JWT토큰 (여러 키에서 시도)
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    const headers = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      // 토큰 유효성 기본 검증
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const now = Date.now() / 1000;
          
          if (payload.exp && payload.exp < now) {
            console.warn("⚠️  토큰이 만료되었습니다. 새로고침이 필요할 수 있습니다.");
          }
        }
      } catch (error) {
        console.warn("⚠️  토큰 파싱 중 오류:", error);
      }
    } else {
      console.warn("⚠️  JWT 토큰이 없어 인증 없이 연결 시도");
    }
    
    // 페이지 새로고침 감지 및 연결 정리
    const handleBeforeUnload = () => {
      if (stompClient.value && isConnected.value) {
        // 명시적으로 연결 해제 (graceful shutdown)
        try {
          stompClient.value.disconnect();
        } catch (error) {
          console.error("연결 해제 중 오류:", error);
        }
      }
    };
    
    // 이벤트 리스너가 이미 등록되어 있지 않은 경우에만 등록
    if (!window.webSocketBeforeUnloadRegistered) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.webSocketBeforeUnloadRegistered = true;
    }

    console.log("🔵 STOMP 연결 시도 시작:", {
      wsUrl: wsUrl,
      endpoint: endpoint,
      hasHeaders: !!headers && Object.keys(headers).length > 0,
      headersKeys: headers ? Object.keys(headers) : [],
      hasToken: !!headers?.Authorization,
      tokenPrefix: headers?.Authorization?.substring(0, 20) || 'none',
      timestamp: new Date().toISOString()
    });
    
    stompClient.value.connect(
      headers, // 헤더 (인증 정보 등이 필요하면 여기에 추가)
      // 연결 성공 콜백
      (frame) => {
        console.log("✅ STOMP 연결 성공:", {
          wsUrl: wsUrl,
          frame: frame,
          command: frame?.command,
          headers: frame?.headers,
          body: frame?.body,
          timestamp: new Date().toISOString()
        });
        
        isConnected.value = true;

        
        // 등록된 콜백들 실행
        connectionCallbacks.value.forEach((callback, index) => {
          try {
            console.log(`🔄 연결 콜백 실행 중 (${index + 1}/${connectionCallbacks.value.size})`);
            callback();
          } catch (error) {
            console.error(`❌ 연결 콜백 실행 중 오류 (${index + 1}):`, error);
          }
        });
      },
      // 연결 실패 콜백
      (error) => {
        console.error("❌ STOMP 연결 실패:", {
          error: error,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          errorMessage: error?.message,
          errorStack: error?.stack,
          wsUrl: wsUrl,
          endpoint: endpoint,
          hasHeaders: !!headers && Object.keys(headers).length > 0,
          headersKeys: headers ? Object.keys(headers) : [],
          hasToken: !!headers?.Authorization,
          tokenExists: !!token,
          tokenLength: token?.length || 0,
          isConnected: isConnected.value,
          hasStompClient: !!stompClient.value,
          timestamp: new Date().toISOString()
        });
        
        // 에러 객체의 모든 속성 출력
        if (error && typeof error === 'object') {
          console.error("📋 에러 객체 상세:", {
            keys: Object.keys(error),
            values: Object.entries(error).reduce((acc, [key, value]) => {
              acc[key] = typeof value === 'string' ? value.substring(0, 100) : value;
              return acc;
            }, {})
          });
        }
        
        // 인증 오류 체크
        const errorStr = String(error?.message || JSON.stringify(error) || '');
        if (errorStr.includes('401') || errorStr.includes('Unauthorized')) {
          console.error("🔐 인증 오류 감지 - 토큰이 유효하지 않거나 만료됨");
          console.log("🔍 토큰 정보:", {
            hasToken: !!token,
            tokenLength: token?.length || 0,
            tokenPrefix: token?.substring(0, 20) || 'none',
            tokenSuffix: token?.substring(token?.length - 20) || 'none'
          });
        }
        
        // 네트워크 오류 체크
        if (errorStr.includes('Network') || errorStr.includes('network') || errorStr.includes('ECONNREFUSED')) {
          console.error("🌐 네트워크 오류 감지 - 서버에 연결할 수 없음");
          console.log("🔍 네트워크 상태:", {
            wsUrl: wsUrl,
            endpoint: endpoint,
            protocol: window.location.protocol,
            host: window.location.host,
            isDev: process.env.NODE_ENV === 'development'
          });
        }

        isConnected.value = false;
        stompClient.value = null; // STOMP 클라이언트 초기화

        // 재연결 시도하지 않음 (수동으로만 연결)
        console.log("⚠️ WebSocket 연결 실패: 수동으로만 재연결 가능");
      }
    );
  } catch (error) {
    console.error("🔴 WebSocket 초기화 오류:", error);
  }
};

/**
 * WebSocket 연결 해제
 * 주의: 앱 종료 시에만 호출해야 함
 */
const disconnect = () => {
  if (stompClient.value && isConnected.value) {
    // 모든 구독 해제
    activeSubscriptions.value.forEach((_, topic) => {
      unsubscribe(topic);
    });

    // 연결 해제
    stompClient.value.disconnect(() => {
      isConnected.value = false;
      stompClient.value = null;
    });
  }
};

/**
 * STOMP 클라이언트 비동기 비활성화
 * 서버로 DISCONNECT 프레임을 보장하고 소켓 리소스를 해제합니다.
 */
const deactivate = async (options = {}) => {
  if (!stompClient.value) {
    return;
  }

  const { disconnectHeaders, force } = options || {};

  if (stompClient.value && disconnectHeaders && typeof disconnectHeaders === 'object') {
    try {
      stompClient.value.disconnectHeaders = disconnectHeaders;
    } catch (error) {
      console.warn('disconnectHeaders 설정 중 오류:', error);
    }
  }

  try {
    // STOMP 5.x deactivate는 Promise 반환
    if (typeof stompClient.value.deactivate === "function") {
      await stompClient.value.deactivate(force);
    } else {
      // 구버전 호환: disconnect 호출
      await new Promise((resolve) => {
        try {
          stompClient.value.disconnect(() => resolve());
        } catch (error) {
          resolve();
        }
      });
    }
  } catch (error) {
    console.error("STOMP 비활성화 중 오류:", error);
  } finally {
    activeSubscriptions.value.clear();
    connectionCallbacks.value.clear();
    isConnected.value = false;
    stompClient.value = null;
  }
};

/**
 * 특정 주제 구독
 * @param {String} topic - 구독할 주제 경로
 * @param {Function} callback - 메시지 수신 시 실행할 콜백
 * @returns {String} 구독 ID (구독 취소 시 사용)
 */
const subscribe = (topic, callback) => {
  console.log('🔵 subscribe 함수 호출:', {
    topic: topic,
    isConnected: isConnected.value,
    hasStompClient: !!stompClient.value,
    alreadySubscribed: activeSubscriptions.value.has(topic),
    timestamp: new Date().toISOString()
  });
  
  // 이미 구독 중인 경우 기존 구독 ID 반환
  if (activeSubscriptions.value.has(topic)) {
    console.log(`⚠️ 이미 ${topic}에 구독 중입니다.`);
    return topic;
  }
  
  // 실제 구독 처리
  if (isConnected.value && stompClient.value) {
    try {
      console.log(`📡 STOMP 구독 시도: ${topic}`);
      
      const subscription = stompClient.value.subscribe(topic, (message) => {
        console.log(`📨 STOMP 메시지 수신 (${topic}):`, {
          topic: topic,
          message: message,
          messageBody: message.body,
          messageHeaders: message.headers,
          timestamp: new Date().toISOString()
        });
        
        try {
          // 메시지 본문 파싱 및 콜백 호출
          const body = message.body ? JSON.parse(message.body) : {};
          console.log(`✅ 메시지 파싱 완료 (${topic}):`, body);
          callback(body);
        } catch (error) {
          console.error(`❌ 메시지 처리 중 오류 (${topic}):`, error, message);
          callback(message);
        }
      });

      // 활성 구독 목록에 추가
      activeSubscriptions.value.set(topic, subscription);
      console.log(`✅ 구독 성공 (${topic}):`, {
        subscriptionId: subscription.id,
        totalSubscriptions: activeSubscriptions.value.size,
        activeTopics: Array.from(activeSubscriptions.value.keys())
      });
      
      return subscription.id;
    } catch (error) {
      console.error(`❌ 구독 오류 (${topic}):`, error);
      return null;
    }
  } else {
    console.warn(`⚠️ WebSocket이 연결되지 않아 ${topic}를 구독할 수 없습니다.`, {
      isConnected: isConnected.value,
      hasStompClient: !!stompClient.value
    });
    return null;
  }
};

/**
 * 구독 취소
 * @param {String} topic - 취소할 구독 주제
 */
const unsubscribe = (topic) => {
  const subscription = activeSubscriptions.value.get(topic);
  if (subscription) {
    if (isConnected.value) {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error(`구독 취소 오류 (${topic}):`, error);
      }
    }
    activeSubscriptions.value.delete(topic);
  }
};

/**
 * 메시지 발행
 * @param {String} destination - 메시지를 발행할 목적지
 * @param {Object|String} body - 발행할 메시지 본문 (객체 또는 문자열)
 * @returns {Boolean} 발행 성공 여부
 */
const publish = (destination, body) => {
  if (!isConnected.value || !stompClient.value) {
    console.warn("WebSocket이 연결되지 않아 메시지를 발행할 수 없습니다.");
    return false;
  }

  try {
    // body가 문자열이 아닌 경우 JSON으로 변환
    const payload = typeof body === "string" ? body : JSON.stringify(body);
    stompClient.value.publish({
      destination,
      body: payload,
    });
    return true;
  } catch (error) {
    console.error("메시지 발행 중 오류:", error);
    return false;
  }
};

/**
 * 연결 콜백 등록
 * @param {Function} callback - 연결 성공 시 실행할 콜백 함수
 */
const addConnectionCallback = (callback) => {
  if (typeof callback === "function") {
    connectionCallbacks.value.add(callback);

    // 이미 연결된 상태라면 즉시 콜백 실행
    if (isConnected.value) {
      callback();
    }
  }
};

export {
  // 상태 (읽기 전용)
  isConnected,
  // 메서드
  connect,
  disconnect,
  deactivate,
  subscribe,
  unsubscribe,
  publish,
  addConnectionCallback,
};
