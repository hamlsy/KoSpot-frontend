import { ref, computed, nextTick } from 'vue';

/**
 * Room Chat 관리 컴포저블
 * 방 채팅 메시지, 시스템 메시지, 읽지 않은 메시지 등을 관리합니다.
 */
export function useRoomChat() {
  // 채팅 상태
  const chatMessages = ref([
    {
      id: 1,
      senderId: 'user2',
      content: '안녕하세요! 게임 시작하나요?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: 2,
      senderId: 'user1',
      content: '네, 곧 시작할게요. 모두 대기해주세요!',
      timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    },
    {
      id: 3,
      senderId: 'user3',
      content: '첫 게임이라 잘 모르겠어요. 어떻게 하는 건가요?',
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    },
    {
      id: 4,
      senderId: 'user1',
      content: '로드뷰나 사진을 보고 지도에 위치를 찍는 게임이에요!',
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    },
    {
      id: 5,
      senderId: 'user4',
      content: '잘 부탁드립니다!',
      timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    },
  ]);
  
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
      content,
      timestamp: new Date().toISOString(),
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
   */
  const handleRoomChatMessage = (chatEvent, currentUserId) => {
    console.log('💬 방 채팅 메시지:', chatEvent);
    
    if (!chatEvent || !chatEvent.message) {
      console.warn('⚠️ 잘못된 채팅 이벤트 형식:', chatEvent);
      return;
    }
    
    // 채팅 메시지 추가
    const message = {
      id: chatEvent.message.id || Date.now(),
      senderId: chatEvent.message.senderId,
      content: chatEvent.message.content,
      timestamp: chatEvent.message.timestamp || new Date().toISOString(),
      senderNickname: chatEvent.message.senderNickname
    };
    
    addChatMessage(message);
    
    // 읽지 않은 메시지 카운트 증가
    if (chatEvent.message.senderId !== currentUserId) {
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