import { ref, computed, nextTick } from 'vue';

/**
 * Room Chat 관리 컴포저블
 * 방 채팅 메시지, 시스템 메시지, 읽지 않은 메시지 등을 관리합니다.
 */
export function useRoomChat() {
  // 채팅 상태 - 빈 배열로 시작 (WebSocket으로부터 메시지 수신)
  const chatMessages = ref([]);
  
  const chatInput = ref('');
  const unreadMessages = ref(0);
  
  // DOM refs
  const chatMessagesRef = ref(null);

  /**
   * 채팅 스크롤을 맨 아래로 이동
   */
  const scrollChatToBottom = () => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
    }
  };

  /**
   * 시스템 메시지 추가
   */
  const addSystemMessage = (content) => {
    const systemMessage = {
      id: Date.now(),
      senderId: 'system',
      senderName: '시스템',
      content,
      timestamp: new Date().toISOString(),
      messageType: 'SYSTEM',
      isSystem: true
    };
    
    chatMessages.value.push(systemMessage);
    
    nextTick(() => {
      scrollChatToBottom();
    });
  };

  /**
   * 일반 채팅 메시지 추가
   */
  const addChatMessage = (message) => {
    chatMessages.value.push(message);
    
    nextTick(() => {
      scrollChatToBottom();
    });
  };

  /**
   * 채팅 메시지 처리 (WebSocket으로부터 수신)
   * roomWebSocket.service.js에서 전달하는 형식:
   * { senderId, messageId, nickname, content, messageType, teamId, timestamp }
   */
  const handleRoomChatMessage = (chatEvent, currentUserId) => {
    
    if (!chatEvent || !chatEvent.content) {
      console.warn('⚠️ 잘못된 채팅 이벤트 형식:', chatEvent);
      return;
    }
    
    // WebSocket에서 받은 메시지 형식을 UI 컴포넌트 형식으로 변환
    const message = {
      id: chatEvent.messageId || Date.now(),
      senderId: chatEvent.senderId,
      senderName: chatEvent.nickname,  // ChatMessage 컴포넌트가 기대하는 필드명
      content: chatEvent.content,
      timestamp: chatEvent.timestamp || new Date().toISOString(),
      messageType: chatEvent.messageType,
      teamId: chatEvent.teamId || null,
      isSystem: chatEvent.messageType === 'SYSTEM'
    };
    
    addChatMessage(message);
    
    // 읽지 않은 메시지 카운트 증가 (자신이 보낸 메시지가 아닌 경우)
    if (chatEvent.senderId !== currentUserId) {
      unreadMessages.value++;
    }
  };

  /**
   * 채팅 토글 (읽지 않은 메시지 카운트 리셋)
   */
  const toggleChat = () => {
    unreadMessages.value = 0;
    nextTick(() => {
      scrollChatToBottom();
    });
  };

  /**
   * 채팅 입력 초기화
   */
  const clearChatInput = () => {
    chatInput.value = '';
  };

  /**
   * 채팅 메시지 목록 초기화
   */
  const clearChatMessages = () => {
    chatMessages.value = [];
    unreadMessages.value = 0;
  };

  /**
   * 채팅 메시지 목록 업데이트 (props로부터)
   */
  const updateChatMessages = (newMessages) => {
    if (newMessages && newMessages.length > chatMessages.value.length) {
      const newCount = newMessages.length - chatMessages.value.length;
      unreadMessages.value += newCount;
      chatMessages.value = newMessages;
      
      nextTick(() => {
        scrollChatToBottom();
      });
    }
  };

  return {
    // 채팅 상태
    chatMessages: computed(() => chatMessages.value),
    chatInput,
    unreadMessages: computed(() => unreadMessages.value),
    chatMessagesRef,
    
    // 채팅 메서드
    scrollChatToBottom,
    addSystemMessage,
    addChatMessage,
    handleRoomChatMessage,
    toggleChat,
    clearChatInput,
    clearChatMessages,
    updateChatMessages
  };
} 