import { ref, readonly } from 'vue';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

/**
 * WebSocket 코어 기능
 * 연결, 구독, 발행 등 기본적인 WebSocket 기능을 제공합니다.
 */

// 상태 변수
const stompClient = ref(null);
const isConnected = ref(false);
const activeSubscriptions = ref(new Map());
const connectionCallbacks = ref(new Set());
const useDummyData = ref(false);

/**
 * WebSocket 서버에 연결
 * @param {String} endpoint - WebSocket 서버 엔드포인트
 * @param {Function} onConnectCallback - 연결 성공 시 실행할 콜백 함수
 */
const connect = (endpoint = '/ws', onConnectCallback = null) => {
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
        // SockJS를 통한 WebSocket 연결 생성
        const socket = new SockJS(endpoint);
        stompClient.value = Stomp.over(socket);

        // 콜백 등록
        if (onConnectCallback) {
            connectionCallbacks.value.add(onConnectCallback);
        }

        // 연결 시도
        stompClient.value.connect(
            {}, // 헤더 (인증 정보 등이 필요하면 여기에 추가)
            // 연결 성공 콜백
            frame => {
                console.log('WebSocket 연결 성공:', frame);
                isConnected.value = true;

                // 등록된 모든 콜백 실행
                connectionCallbacks.value.forEach(callback => {
                    try {
                        callback();
                    } catch (error) {
                        console.error('연결 콜백 실행 중 오류:', error);
                    }
                });
            },
            // 연결 실패 콜백
            error => {
                console.error('WebSocket 연결 오류:', error);
                isConnected.value = false;
                
                // 더미 데이터 모드로 전환
                useDummyData.value = true;
                console.log('더미 데이터 모드로 전환됩니다.');
                
                // 5초 후 재연결 시도
                setTimeout(() => {
                    if (!isConnected.value) {
                        console.log('WebSocket 재연결 시도...');
                        connect(endpoint);
                    }
                }, 5000);
            }
        );
    } catch (error) {
        console.error('WebSocket 초기화 오류:', error);
        useDummyData.value = true;
        console.log('더미 데이터 모드로 전환됩니다.');
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
            console.log('WebSocket 연결 해제됨');
            isConnected.value = false;
            stompClient.value = null;
        });
    }
};

/**
 * 특정 주제 구독
 * @param {String} topic - 구독할 주제 경로
 * @param {Function} callback - 메시지 수신 시 실행할 콜백
 * @returns {String} 구독 ID (구독 취소 시 사용)
 */
const subscribe = (topic, callback) => {
    // 이미 구독 중인 경우 기존 구독 ID 반환
    if (activeSubscriptions.value.has(topic)) {
        return topic;
    }

    // 더미 데이터 모드인 경우 가짜 구독 처리
    if (useDummyData.value) {
        console.log(`더미 모드: ${topic} 구독 시뮬레이션`);
        activeSubscriptions.value.set(topic, { id: topic, callback });
        return topic;
    }

    // 실제 구독 처리
    if (isConnected.value && stompClient.value) {
        try {
            const subscription = stompClient.value.subscribe(topic, message => {
                try {
                    // 메시지 본문 파싱 및 콜백 호출
                    const body = message.body ? JSON.parse(message.body) : {};
                    callback(body);
                } catch (error) {
                    console.error(`메시지 처리 중 오류 (${topic}):`, error);
                    callback(message);
                }
            });

            // 활성 구독 목록에 추가
            activeSubscriptions.value.set(topic, subscription);
            console.log(`${topic} 구독 성공`);
            return subscription.id;
        } catch (error) {
            console.error(`구독 오류 (${topic}):`, error);
            return null;
        }
    } else {
        console.warn('WebSocket이 연결되지 않아 구독할 수 없습니다.');
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
        if (!useDummyData.value && isConnected.value) {
            try {
                subscription.unsubscribe();
                console.log(`${topic} 구독 취소됨`);
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
        console.warn('WebSocket이 연결되지 않아 메시지를 발행할 수 없습니다.');
        return false;
    }

    try {
        // body가 문자열이 아닌 경우 JSON으로 변환
        const payload = typeof body === 'string' ? body : JSON.stringify(body);
        stompClient.value.publish({
            destination,
            body: payload
        });
        return true;
    } catch (error) {
        console.error('메시지 발행 중 오류:', error);
        return false;
    }
};

/**
 * 더미 데이터 모드 설정
 * @param {Boolean} value - 더미 데이터 모드 활성화 여부
 */
const setDummyMode = (value) => {
    useDummyData.value = Boolean(value);
};

/**
 * 연결 콜백 등록
 * @param {Function} callback - 연결 성공 시 실행할 콜백 함수
 */
const addConnectionCallback = (callback) => {
    if (typeof callback === 'function') {
        connectionCallbacks.value.add(callback);
        
        // 이미 연결된 상태라면 즉시 콜백 실행
        if (isConnected.value) {
            callback();
        }
    }
};

export {
    // 상태 (읽기 전용)
    isConnected: readonly(isConnected),
    useDummyData: readonly(useDummyData),
    
    // 메서드
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    publish,
    setDummyMode,
    addConnectionCallback,
};
