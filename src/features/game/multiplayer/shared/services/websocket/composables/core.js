import { ref, readonly } from "vue";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { resolveSockJsUrl } from "@/core/platform/websocketUrl.js";

/**
 * WebSocket 코어 기능
 * 연결, 구독, 발행 등 기본적인 WebSocket 기능을 제공합니다.
 */

// 개발 환경 여부 확인
const isDevelopment = process.env.NODE_ENV === "development";

// 개발 환경에서만 로그 출력하는 헬퍼 함수
const log = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

const warn = (...args) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

const error = (...args) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

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
    } catch (err) {
      error("기존 연결 정리 중 오류:", err);
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
    const wsUrl = resolveSockJsUrl();
    if (isDevelopment) {
      log("🔵 WebSocket URL:", wsUrl);
    }


    // SockJS 설정 옵션 
    const sockjsOptions = {
      timeout: 10000, // 10초 타임아웃
      transports: ["websocket", "xhr-polling", "jsonp-polling"],
    };


    const socket = new SockJS(wsUrl, undefined, sockjsOptions);

    log("🔵 SockJS 인스턴스 생성 완료:", {
      wsUrl: wsUrl,
      readyState: socket.readyState,
      protocol: socket.protocol,
      timestamp: new Date().toISOString()
    });

    // SockJS 이벤트 리스너 추가
    socket.onclose = function (event) {
      log("🔴 SockJS onclose 이벤트 발생:", {
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
        warn("⚠️ SockJS 연결이 완료되지 않은 상태에서 종료됨");
        log("📊 연결 상태 상세:", {
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
          } catch (err) {
            error("SockJS 실패 콜백 실행 중 오류:", err);
          }
        });
      }
    };

    socket.onerror = function (err) {
      error("🔴 SockJS onerror 이벤트 발생:", {
        error: err,
        errorType: err?.type,
        errorTarget: err?.target,
        errorMessage: err?.message,
        currentURL: err?.target?.url || wsUrl,
        readyState: err?.target?.readyState,
        isConnected: isConnected.value,
        timestamp: new Date().toISOString()
      });

      // 추가 에러 정보 수집
      if (err?.target) {
        error("📋 SockJS 에러 타겟 상세:", {
          url: err.target.url,
          readyState: err.target.readyState,
          protocol: err.target.protocol,
          extensions: err.target.extensions
        });
      }

      // SockJS 오류 시 즉시 더미 모드로 전환
      if (!isConnected.value) {
        warn("⚠️ SockJS 연결 오류로 인해 더미 모드로 전환");
        stompClient.value = null;

        // 등록된 콜백들을 더미 모드로 실행
        connectionCallbacks.value.forEach((callback) => {
          try {
            callback();
          } catch (callbackErr) {
            error("SockJS 오류 콜백 실행 중 오류:", callbackErr);
          }
        });
      }
    };

    // SockJS 연결 상태 변화 추적
    socket.onopen = function (event) {

    };

    // SockJS 메시지 이벤트 (디버깅용)
    socket.onmessage = function (event) {
      log("📨 SockJS 메시지 수신:", {
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
    if (isDevelopment) {
      stompClient.value.debug = function (str) {
        // log("STOMP:", str);
      };
    } else {
      stompClient.value.debug = function () { }; // 디버깅 비활성화
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
            warn("⚠️  토큰이 만료되었습니다. 새로고침이 필요할 수 있습니다.");
          }
        }
      } catch (tokenError) {
        warn("⚠️  토큰 파싱 중 오류:", tokenError);
      }
    } else {
      warn("⚠️  JWT 토큰이 없어 인증 없이 연결 시도");
    }

    // 페이지 새로고침 감지 및 연결 정리
    const handleBeforeUnload = () => {
      if (stompClient.value && isConnected.value) {
        // 명시적으로 연결 해제 (graceful shutdown)
        try {
          stompClient.value.disconnect();
        } catch (err) {
          error("연결 해제 중 오류:", err);
        }
      }
    };

    // 이벤트 리스너가 이미 등록되어 있지 않은 경우에만 등록
    if (!window.webSocketBeforeUnloadRegistered) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.webSocketBeforeUnloadRegistered = true;
    }


    stompClient.value.connect(
      headers, // 헤더 (인증 정보 등이 필요하면 여기에 추가)
      // 연결 성공 콜백
      (frame) => {

        isConnected.value = true;


        // 등록된 콜백들 실행
        connectionCallbacks.value.forEach((callback, index) => {
          try {
            log(`🔄 연결 콜백 실행 중 (${index + 1}/${connectionCallbacks.value.size})`);
            callback();
          } catch (callbackError) {
            error(`❌ 연결 콜백 실행 중 오류 (${index + 1}):`, callbackError);
          }
        });
        // ✅ 재연결 시 콜백 중복 실행 방지: 실행 후 즉시 초기화
        connectionCallbacks.value.clear();
      },
      // 연결 실패 콜백
      (err) => {
        error("❌ STOMP 연결 실패:", {
          error: err,
          errorType: typeof err,
          errorConstructor: err?.constructor?.name,
          errorMessage: err?.message,
          errorStack: err?.stack,
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
        if (err && typeof err === 'object') {
          error("📋 에러 객체 상세:", {
            keys: Object.keys(err),
            values: Object.entries(err).reduce((acc, [key, value]) => {
              acc[key] = typeof value === 'string' ? value.substring(0, 100) : value;
              return acc;
            }, {})
          });
        }

        // 인증 오류 체크
        const errorStr = String(err?.message || JSON.stringify(err) || '');
        if (errorStr.includes('401') || errorStr.includes('Unauthorized')) {
          error("🔐 인증 오류 감지 - 토큰이 유효하지 않거나 만료됨");
          log("🔍 토큰 정보:", {
            hasToken: !!token,
            tokenLength: token?.length || 0,
            tokenPrefix: token?.substring(0, 20) || 'none',
            tokenSuffix: token?.substring(token?.length - 20) || 'none'
          });
        }

        // 네트워크 오류 체크
        if (errorStr.includes('Network') || errorStr.includes('network') || errorStr.includes('ECONNREFUSED')) {
          error("🌐 네트워크 오류 감지 - 서버에 연결할 수 없음");
          log("🔍 네트워크 상태:", {
            wsUrl: wsUrl,
            endpoint: endpoint,
            protocol: window.location.protocol,
            host: window.location.host,
            isDev: isDevelopment
          });
        }

        isConnected.value = false;
        stompClient.value = null; // STOMP 클라이언트 초기화

        // 재연결 시도하지 않음 (수동으로만 연결)
        log("⚠️ WebSocket 연결 실패: 수동으로만 재연결 가능");
      }
    );
  } catch (err) {
    error("🔴 WebSocket 초기화 오류:", err);
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
    } catch (err) {
      warn('disconnectHeaders 설정 중 오류:', err);
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
        } catch (err) {
          resolve();
        }
      });
    }
  } catch (err) {
    error("STOMP 비활성화 중 오류:", err);
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


  // 이미 구독 중인 경우 기존 구독 해제 후 새로 구독 (핸들러 업데이트를 위해)
  if (activeSubscriptions.value.has(topic)) {
    unsubscribe(topic);
  }

  // 실제 구독 처리
  if (isConnected.value && stompClient.value) {
    try {
      log(`📡 STOMP 구독 시도: ${topic}`);

      const subscription = stompClient.value.subscribe(topic, (message) => {
        try {
          // 메시지 본문 파싱 및 콜백 호출
          const body = message.body ? JSON.parse(message.body) : {};
          callback(body);
        } catch (parseError) {
          error(`❌ 메시지 처리 중 오류 (${topic}):`, parseError, message);
          callback(message);
        }
      });

      // 활성 구독 목록에 추가
      activeSubscriptions.value.set(topic, subscription);

      return subscription.id;
    } catch (err) {
      error(`❌ 구독 오류 (${topic}):`, err);
      return null;
    }
  } else {
    warn(`⚠️ WebSocket이 연결되지 않아 ${topic}를 구독할 수 없습니다.`, {
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
      } catch (err) {
        error(`구독 취소 오류 (${topic}):`, err);
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
    warn("WebSocket이 연결되지 않아 메시지를 발행할 수 없습니다.");
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
  } catch (err) {
    error("메시지 발행 중 오류:", err);
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
