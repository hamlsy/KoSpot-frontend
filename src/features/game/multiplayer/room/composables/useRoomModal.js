import { ref, computed } from 'vue';

/**
 * Room Modal 관리 컴포저블
 * 방 설정, 플레이어 상세 정보, 강퇴 확인 등 모달 상태를 관리합니다.
 */
export function useRoomModal() {
  // 모달 상태
  const isRoomSettingsOpen = ref(false);
  const isKickModalOpen = ref(false);
  const isPlayerDetailsOpen = ref(false);
  
  // 모달 관련 데이터
  const playerToKick = ref(null);
  const selectedPlayer = ref(null);

  /**
   * 방 설정 모달 열기
   */
  const openRoomSettings = () => {
    isRoomSettingsOpen.value = true;
  };

  /**
   * 방 설정 모달 닫기
   */
  const closeRoomSettings = () => {
    isRoomSettingsOpen.value = false;
  };

  /**
   * 플레이어 상세 정보 모달 열기
   */
  const showPlayerDetails = (player) => {
    selectedPlayer.value = player;
    isPlayerDetailsOpen.value = true;
  };

  /**
   * 플레이어 상세 정보 모달 닫기
   */
  const closePlayerDetails = () => {
    isPlayerDetailsOpen.value = false;
    selectedPlayer.value = null;
  };

  /**
   * 강퇴 확인 모달 열기
   */
  const confirmKickPlayer = (player) => {
    playerToKick.value = player;
    isKickModalOpen.value = true;
    // 플레이어 상세 모달이 열려있다면 닫기
    isPlayerDetailsOpen.value = false;
  };

  /**
   * 강퇴 확인 모달 닫기
   */
  const closeKickModal = () => {
    isKickModalOpen.value = false;
    playerToKick.value = null;
  };

  /**
   * 모든 모달 닫기
   */
  const closeAllModals = () => {
    closeRoomSettings();
    closePlayerDetails();
    closeKickModal();
  };

  return {
    // 모달 상태
    isRoomSettingsOpen: computed(() => isRoomSettingsOpen.value),
    isKickModalOpen: computed(() => isKickModalOpen.value),
    isPlayerDetailsOpen: computed(() => isPlayerDetailsOpen.value),
    
    // 모달 데이터
    playerToKick: computed(() => playerToKick.value),
    selectedPlayer: computed(() => selectedPlayer.value),
    
    // 모달 제어 메서드
    openRoomSettings,
    closeRoomSettings,
    showPlayerDetails,
    closePlayerDetails,
    confirmKickPlayer,
    closeKickModal,
    closeAllModals
  };
} 