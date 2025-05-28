import { ref, onMounted, onUnmounted } from 'vue';

/**
 * 웹소켓 통신 기능을 제공하는 컴포저블
 * @param {Object} options - 웹소켓 옵션
 * @returns {Object} - 웹소켓 관련 상태 및 메서드
 */
export default function useWebSocket(options = {}) {
  const socket = ref(null);
  const isConnected = ref(false);
  const error = ref(null);
  const messages = ref([]);

  // 웹소켓 연결
  const connect = (url = options.url) => {
    if (!url) {
      error.value = '웹소켓 URL이 제공되지 않았습니다.';
      return false;
    }

    try {
      socket.value = new WebSocket(url);

      // 연결 이벤트
      socket.value.onopen = () => {
        isConnected.value = true;
        error.value = null;
        if (options.onConnect) options.onConnect();
      };

      // 메시지 수신 이벤트
      socket.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          messages.value.push(data);
          if (options.onMessage) options.onMessage(data);
        } catch (err) {
          console.error('메시지 파싱 오류:', err);
          if (options.onError) options.onError(err);
        }
      };

      // 오류 이벤트
      socket.value.onerror = (event) => {
        error.value = '웹소켓 연결 오류가 발생했습니다.';
        if (options.onError) options.onError(event);
      };

      // 연결 종료 이벤트
      socket.value.onclose = (event) => {
        isConnected.value = false;
        if (options.onClose) options.onClose(event);

        // 자동 재연결
        if (options.autoReconnect && !event.wasClean) {
          setTimeout(() => {
            connect(url);
          }, options.reconnectDelay || 3000);
        }
      };

      return true;
    } catch (err) {
      error.value = err.message || '웹소켓 연결 중 오류가 발생했습니다.';
      return false;
    }
  };

  // 메시지 전송
  const send = (data) => {
    if (!socket.value || socket.value.readyState !== WebSocket.OPEN) {
      error.value = '웹소켓이 연결되지 않았습니다.';
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      socket.value.send(message);
      return true;
    } catch (err) {
      error.value = err.message || '메시지 전송 중 오류가 발생했습니다.';
      return false;
    }
  };

  // 연결 종료
  const disconnect = () => {
    if (!socket.value) return;

    try {
      socket.value.close();
      socket.value = null;
      isConnected.value = false;
    } catch (err) {
      error.value = err.message || '연결 종료 중 오류가 발생했습니다.';
    }
  };

  // 컴포넌트 마운트 시 자동 연결
  onMounted(() => {
    if (options.autoConnect && options.url) {
      connect(options.url);
    }
  });

  // 컴포넌트 언마운트 시 연결 종료
  onUnmounted(() => {
    disconnect();
  });

  return {
    socket,
    isConnected,
    error,
    messages,
    connect,
    send,
    disconnect
  };
}
