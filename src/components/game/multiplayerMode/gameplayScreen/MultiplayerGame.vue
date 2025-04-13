<template>
  <div class="multiplayer-game-container">
    <!-- 대기실 모드 -->
    <game-room-waiting 
      v-if="gameState === 'waiting'"
      :room-id="roomId"
      @leave-room="exitToLobby"
      @start-game="onGameStart"
    />
    
    <!-- 게임 플레이 모드 -->
    <div v-else-if="gameState === 'playing'" class="multiplayer-game">
      <!-- 게임 헤더 -->
      <div class="game-header">
        <div class="header-left">
          <button class="exit-button" @click="exitGame">
            <i class="fas fa-door-open"></i>
            나가기
          </button>
          <div class="room-info">
            <h2 class="room-name">{{ roomData.name }}</h2>
            <div class="game-mode">{{ roomData.gameMode }} - {{ roomData.region }}</div>
          </div>
        </div>
        
        <div class="header-center">
          <div class="round-info">
            <span class="round-number">라운드 {{ currentRound }}/{{ totalRounds }}</span>
            <div class="round-progress">
              <div 
                class="progress-bar" 
                :style="{ width: `${(currentRound / totalRounds) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
        
        <div class="header-right">
          <game-timer 
            :initialTime="remainingTime"
            :totalTime="120"
            :warning-threshold="30"
            :danger-threshold="10"
          />
        </div>
      </div>
      
      <!-- 게임 메인 영역 -->
      <div class="game-content">
        <!-- 왼쪽 패널: 플레이어 목록 -->
        <div class="left-panel">
          <player-list 
            :players="players" 
            :current-user-id="currentUser.id"
            :show-scores="hasSubmittedGuess || roundEnded"
          />
        </div>
        
        <!-- 중앙 패널: 게임 화면 -->
        <div class="main-panel">
          <div class="game-view">
            <road-view 
              v-if="roomData.gameMode === '로드뷰'"
              :position="currentLocation"
              :show-controls="true"
              :prevent-mouse-events="roundEnded"
              @load-complete="onViewLoaded"
            />
            <photo-view
              v-else
              :photo-url="currentPhotoUrl"
              :prevent-interaction="roundEnded"
              @load-complete="onViewLoaded"
            />
          </div>
          
          <div class="map-container" :class="{ expanded: isMapExpanded }">
            <kakao-map
              ref="gameMap"
              :center="mapCenter"
              :marker-position="guessPosition"
              :actual-position="roundEnded ? actualLocation : null"
              :prevent-interaction="roundEnded"
              @marker-placed="onGuessPlaced"
            />
            <button 
              class="expand-map-button"
              @click="toggleMapExpansion"
              :title="isMapExpanded ? '맵 축소' : '맵 확대'"
            >
              <i :class="isMapExpanded ? 'fas fa-compress-alt' : 'fas fa-expand-alt'"></i>
            </button>
          </div>
        </div>
        
        <!-- 오른쪽 패널: 채팅 -->
        <div class="right-panel">
          <chat-window 
            v-if="!isTeamMode"
            :messages="chatMessages"
            @send-message="sendChatMessage"
          />
          
          <!-- 팀 모드일 경우 팀 채팅 표시 -->
          <team-chat
            v-if="isTeamMode && currentUser.teamId"
            :team-id="currentUser.teamId"
            :team-name="currentUserTeam ? currentUserTeam.name : ''"
            :team-color="currentUserTeam ? getTeamColor(currentUserTeam.id) : 'blue'"
            :team-messages="currentTeamMessages"
            :current-user-id="currentUser.id"
            @send-team-message="sendTeamMessage"
          />
        </div>
      </div>
      
      <!-- 게임 하단 영역 -->
      <div class="game-footer">
        <div class="guess-info" v-if="guessPosition">
          <i class="fas fa-map-marker-alt"></i>
          <span class="coords">
            {{ formatCoords(guessPosition) }}
          </span>
        </div>
        
        <button 
          class="submit-button"
          @click="submitGuess"
          :disabled="!canSubmit"
        >
          <template v-if="!hasSubmittedGuess">
            <i class="fas fa-check"></i>
            위치 제출
          </template>
          <template v-else>
            <i class="fas fa-clock"></i>
            다른 플레이어 대기 중...
          </template>
        </button>
      </div>
      
      <!-- 라운드 결과 모달 -->
      <round-results
        v-if="showRoundResults && !isTeamMode"
        :visible="showRoundResults"
        :players="players"
        :actual-location="actualLocation"
        :round="currentRound"
        :total-rounds="totalRounds"
        :current-user-id="currentUser.id"
        :location-name="currentLocationName"
        :location-description="currentLocationDescription"
        :location-image="currentLocationImage"
        :interesting-fact="currentInterestingFact"
        @close="closeRoundResults"
        @next-round="startNextRound"
        @finish-game="finishGame"
      />

      <!-- 팀 모드 라운드 결과 모달 -->
      <team-round-results
        v-if="showRoundResults && isTeamMode"
        :visible="showRoundResults"
        :teams="teams"
        :players="players"
        :actual-location="actualLocation"
        :round="currentRound"
        :total-rounds="totalRounds"
        :current-user-id="currentUser.id"
        :current-user-team="currentUser.teamId"
        :location-name="currentLocationName"
        :location-description="currentLocationDescription"
        :location-image="currentLocationImage"
        :interesting-fact="currentInterestingFact"
        @close="closeRoundResults"
        @next-round="startNextRound"
        @finish-game="finishGame"
      />
    </div>
    
    <!-- 게임 결과 모달 -->
    <game-results
      v-if="showGameResults && !isTeamMode"
      :visible="showGameResults"
      :players="players"
      :room-data="roomData"
      @play-again="restartGame"
      @exit="exitToLobby"
    />

    <!-- 팀 게임 결과 모달 -->
    <team-game-results
      v-if="showGameResults && isTeamMode"
      :visible="showGameResults"
      :teams="teams"
      :players="players"
      :room-data="roomData"
      :chat-messages="chatMessages"
      @play-again="restartGame"
      @exit="exitToLobby"
      @send-chat-message="sendChatMessage"
    />

    <!-- 팀 투표 모달 -->
    <team-voting-modal
      v-if="showTeamVoting"
      :visible="showTeamVoting"
      :initiator="voteInitiator"
      :guess-position="guessPosition"
      :time-limit="20"
      :map-preview-url="mapPreviewUrl"
      :current-user-id="currentUser.id"
      @vote-submitted="handleVoteSubmission"
      @voting-completed="handleVotingComplete"
    />
    
    <!-- 로딩 오버레이 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i>
        <p>로딩 중...</p>
      </div>
    </div>
  </div>
</template>

<script>
import GameTimer from '@/components/game/common/shared/GameTimer.vue';
import PlayerList from './PlayerList.vue';
import RoadView from '@/components/game/common/roadview/RoadView.vue';
import PhotoView from '@/components/game/common/photo/PhotoView.vue';
import KakaoMap from '@/components/game/common/kakao/KakaoMap.vue';
import ChatWindow from '../lobbyScreen/ChatWindow.vue';
import RoundResults from './RoundResults.vue';
import GameResults from './GameResults.vue';
import GameRoomWaiting from '../gameRoomScreen/GameRoomWaiting.vue';
import TeamChat from './TeamChat.vue';
import TeamVotingModal from './TeamVotingModal.vue';
import TeamGameResults from './TeamGameResults.vue';
import TeamRoundResults from './TeamRoundResults.vue';

// 테스트 데이터 가져오기
import { testData, individualTestData, getRandomLocation } from '../MultiplayerGameTestData.js';

export default {
  name: 'MultiplayerGame',
  
  components: {
    GameTimer,
    PlayerList,
    RoadView,
    PhotoView,
    KakaoMap,
    ChatWindow,
    RoundResults,
    GameResults,
    GameRoomWaiting,
    TeamChat,
    TeamVotingModal,
    TeamGameResults,
    TeamRoundResults
  },
  
  props: {
    roomId: {
      type: String,
      required: true
    }
  },
  
  data() {
    // 기본 데이터와 테스트 데이터 합치기
    const useTestData = true; // 테스트 데이터 사용 여부 (프로덕션에서는 false로 변경 필요)
    const isTeamMode = true; // 팀 모드 테스트 여부
    
    // 테스트 모드에서 사용할 데이터 선택
    const defaultData = {
      // 게임 상태 (waiting: 대기실, playing: 게임 중)
      gameState: 'waiting',
      
      // 게임 방 정보
      roomData: {
        name: '멋진 게임방',
        gameMode: '로드뷰',
        matchType: 'individual', // 'individual' 또는 'team'
        region: '서울',
        maxPlayers: 4
      },
      
      // 현재 사용자 정보
      currentUser: {
        id: 'user123',
        nickname: '김코스팟',
        level: 23,
        profileImage: '/assets/default-profile.png',
        teamId: null
      },
      
      // 게임 플레이 데이터
      players: [],
      teams: [], // 팀 모드에서 사용할 팀 정보
      currentRound: 1,
      totalRounds: 5,
      remainingTime: 120,
      chatMessages: [],
      teamChatMessages: {}, // 팀별 채팅 메시지
      currentLocation: null,
      currentPhotoUrl: null,
      actualLocation: null,
      currentLocationName: '',
      currentLocationDescription: '',
      currentLocationImage: '',
      currentInterestingFact: '',
      guessPosition: null,
      mapCenter: { lat: 36.5, lng: 127.5 },
      isMapExpanded: false,
      roundTimer: null,
      hasSubmittedGuess: false,
      roundEnded: false,
      showRoundResults: false,
      showGameResults: false,
      isLoading: false,
      canSubmit: false,
      
      // 팀 모드 관련 데이터
      showTeamVoting: false,
      voteInitiator: null,
      votingResults: {
        yes: 0,
        no: 0,
        total: 0
      },
      activeTeamChatId: null,
      mapPreviewUrl: '',
      
      // 테스트용 가상 데이터
      mockTeams: [
        {
          id: 'team1',
          name: '블루',
          color: 'blue',
          totalScore: 0
        },
        {
          id: 'team2',
          name: '레드',
          color: 'red',
          totalScore: 0
        },
        {
          id: 'team3',
          name: '그린',
          color: 'green',
          totalScore: 0
        },
        {
          id: 'team4',
          name: '옐로우',
          color: 'yellow',
          totalScore: 0
        }
      ]
    };
    
    // 테스트 모드에서는 테스트 데이터 사용
    if (useTestData) {
      const selectedTestData = isTeamMode ? testData : individualTestData;
      
      return {
        ...defaultData,
        gameState: 'playing', // 테스트를 위해 바로 게임 시작
        roomData: selectedTestData.roomData,
        currentUser: selectedTestData.currentUser,
        players: selectedTestData.players,
        teams: selectedTestData.teams,
        chatMessages: selectedTestData.chatMessages,
        teamChatMessages: selectedTestData.teamChatMessages || {}
      };
    }
    
    return defaultData;
  },
  
  computed: {
    // 팀 모드인지 확인
    isTeamMode() {
      return this.roomData.matchType === 'team';
    },
    
    // 현재 사용자의 팀
    currentUserTeam() {
      if (!this.isTeamMode || !this.currentUser.teamId) return null;
      
      return this.teams.find(team => team.id === this.currentUser.teamId);
    },
    
    // 현재 사용자 팀의 다른 팀원들
    teamMembers() {
      if (!this.isTeamMode || !this.currentUser.teamId) return [];
      
      return this.players.filter(player => 
        player.teamId === this.currentUser.teamId && 
        player.id !== this.currentUser.id
      );
    },
    
    // 현재 사용자 팀의 채팅 메시지
    currentTeamMessages() {
      if (!this.isTeamMode || !this.currentUser.teamId) return [];
      
      return this.teamChatMessages[this.currentUser.teamId] || [];
    },
    
    // 현재 팀에서 제출할 수 있는지 여부 (팀 모드일 경우)
    canTeamSubmit() {
      if (!this.isTeamMode) return this.canSubmit;
      
      // 이미 제출했거나 라운드가 끝난 경우
      if (this.hasSubmittedGuess || this.roundEnded) return false;
      
      // 위치를 선택했는지 확인
      return !!this.guessPosition;
    },
    
    // 맵 미리보기 URL (투표 모달에서 사용)
    // 실제 구현에서는 Kakao Maps API를 사용하여 정적 지도 이미지 URL 생성
    // mapPreviewUrl() {
    //   if (!this.guessPosition) return '';
      
    //   // 정적 지도 이미지 URL 예시 (실제로는 Kakao Maps API 사용)
    //   return `https://via.placeholder.com/300x150?text=Map+Preview+(${this.guessPosition.lat.toFixed(4)},${this.guessPosition.lng.toFixed(4)})`;
    // }
  },
  
  watch: {
    // 기존 watch...
    
    // 팀 모드에서 투표 시작시 타이머 일시정지
    showTeamVoting(newValue) {
      if (newValue) {
        this.pauseTimer();
      } else {
        this.resumeTimer();
      }
    }
  },
  
  created() {
    // 테스트 모드에서는 컴포넌트 생성 시 게임 초기화
    this.initializeGame();
  },
  
  methods: {
    // 대기실 → 게임 전환
    onGameStart() {
      this.isLoading = true;
      
      // 게임 데이터 초기화 및 로드
      setTimeout(() => {
        this.gameState = 'playing';
        this.initializeGame();
        this.isLoading = false;
      }, 1000);
    },
    
    // 게임 초기화
    // initializeGame() {
    //   this.currentRound = 1;
    //   this.hasSubmittedGuess = false;
    //   this.roundEnded = false;
    //   this.showRoundResults = false;
    //   this.showGameResults = false;
      
    //   // 게임 위치 데이터 로드
    //   this.loadLocationData();
      
    //   // 타이머 시작
    //   this.startRoundTimer();
    // },
    
    // 게임 종료 후 대기실로 돌아가기
    returnToWaitingRoom() {
      this.gameState = 'waiting';
      
      if (this.roundTimer) {
        clearInterval(this.roundTimer);
        this.roundTimer = null;
      }
    },
    
    // 로비로 나가기
    exitToLobby() {
      // 타이머 정리
      if (this.roundTimer) {
        clearInterval(this.roundTimer);
        this.roundTimer = null;
      }
      
      // 로비로 이동
      this.$router.push('/multiplayerLobby');
    },
    
    // 게임 도중 나가기
    exitGame() {
      if (confirm('정말 게임을 나가시겠습니까? 진행 중인 게임은 저장되지 않습니다.')) {
        this.returnToWaitingRoom();
      }
    },
    
    // 위치 데이터 로드
    loadLocationData() {
      // 실제 구현에서는 API 호출
      
      // 테스트 데이터
      this.currentLocation = { lat: 37.5665, lng: 126.9780 }; // 서울
      this.actualLocation = { lat: 37.5665, lng: 126.9780 };
      this.currentLocationName = '서울 광화문';
      this.currentLocationDescription = '서울 중심부에 위치한 역사적 장소';
      this.currentLocationImage = '/assets/locations/gwanghwamun.jpg';
      this.currentInterestingFact = '광화문은 조선시대 경복궁의 남쪽에 있는 정문입니다.';
      
      // 테스트용 플레이어 데이터
      this.players = [
        {
          id: 'user123',
          nickname: '김코스팟',
          level: 23,
          profileImage: '/assets/default-profile.png',
          isHost: true,
          score: 0,
          totalScore: 0,
          guessPosition: null,
          distance: null,
          hasSubmitted: false
        },
        {
          id: 'user456',
          nickname: '지리학자',
          level: 45,
          profileImage: '/assets/avatar1.png',
          isHost: false,
          score: 0,
          totalScore: 0,
          guessPosition: null,
          distance: null,
          hasSubmitted: false
        },
        {
          id: 'user789',
          nickname: '여행마니아',
          level: 31,
          profileImage: '/assets/avatar2.png',
          isHost: false,
          score: 0,
          totalScore: 0,
          guessPosition: null,
          distance: null,
          hasSubmitted: false
        }
      ];
    },
    
    // 좌표 포맷팅
    formatCoords(position) {
      if (!position) return '';
      
      const lat = position.lat.toFixed(4);
      const lng = position.lng.toFixed(4);
      return `${lat}, ${lng}`;
    },
    
    // 추측 위치 설정
    onGuessPlaced(position) {
      this.guessPosition = position;
      this.canSubmit = true;
    },
    
    // 맵 확대/축소 토글
    toggleMapExpansion() {
      this.isMapExpanded = !this.isMapExpanded;
    },
    
    // 로드뷰/사진 로딩 완료
    onViewLoaded() {
      // 로딩 관련 로직
    },
    
    // 채팅 메시지 전송
    sendChatMessage(message) {
      // 채팅 메시지 처리
      if (!message.trim()) return;
      
      const newMessage = {
        id: `chat-${Date.now()}`,
        sender: this.currentUser.nickname,
        message: message,
        timestamp: new Date(),
        system: false
      };
      
      this.chatMessages.push(newMessage);
    },
    
    // 라운드 타이머 시작
    startRoundTimer() {
      this.remainingTime = 120; // 2분
      
      this.roundTimer = setInterval(() => {
        this.remainingTime--;
        
        if (this.remainingTime <= 0) {
          clearInterval(this.roundTimer);
          this.endRound();
        }
      }, 1000);
    },
    
    // 타이머 시작
    startTimer() {
      if (this.roundTimer) {
        clearInterval(this.roundTimer);
      }
      
      this.roundTimer = setInterval(() => {
        this.remainingTime--;
        
        if (this.remainingTime <= 0) {
          clearInterval(this.roundTimer);
          this.endRound();
        }
      }, 1000);
    },
    
    // 라운드 데이터 가져오기
    fetchRoundData() {
      // 실제 구현에서는 API를 통해 데이터를 가져옴
      // 테스트를 위한 가상 데이터
      setTimeout(() => {
        // 가상의 위치 데이터 설정
        const location = getRandomLocation();
        
        this.currentLocation = { lat: location.lat, lng: location.lng };
        this.currentLocationName = location.name;
        this.currentLocationDescription = location.description;
        this.currentLocationImage = location.image;
        this.currentInterestingFact = location.fact;
        
        // 로딩 상태 해제
        this.isLoading = false;
        
        // 타이머 시작
        this.remainingTime = 120;
        this.startRoundTimer();
      }, 1500);
    },
    
    // 추측 제출
    submitGuess() {
      // 팀 모드인 경우 팀 제출 처리
      if (this.isTeamMode) {
        this.submitTeamGuess();
        return;
      }
      
      // 개인전 모드일 경우 기존 처리
      if (!this.canSubmit) return;
      
      this.hasSubmittedGuess = true;
      
      // 실제 구현에서는 서버로 제출 처리
      // 테스트를 위해 일정 시간 후 라운드 종료 처리
      setTimeout(() => {
        this.endRound();
      }, 1000);
    },
    
    // 라운드 종료
    endRound() {
      this.roundEnded = true;
      this.clearTimer();
      
      // 테스트를 위한 실제 위치 세팅 (실제로는 서버에서 받아옴)
      this.actualLocation = {
        lat: this.currentLocation.latitude + (Math.random() * 0.1 - 0.05),
        lng: this.currentLocation.longitude + (Math.random() * 0.1 - 0.05)
      };
      
      // 팀 모드 게임에서 점수 계산
      if (this.isTeamMode) {
        // 각 팀별 점수 계산 (실제로는 서버에서 계산)
        this.teams.forEach(team => {
          // 해당 팀의 플레이어들
          const teamPlayers = this.players.filter(p => p.teamId === team.id);
          
          // 무작위 점수 부여 (테스트용)
          const teamScore = Math.floor(Math.random() * 500) + 500;
          team.totalScore += teamScore;
          
          // 팀원들에게도 점수 배분
          teamPlayers.forEach(player => {
            if (!player.score) player.score = 0;
            player.score += Math.floor(teamScore / teamPlayers.length);
          });
        });
      } else {
        // 개인전 모드 점수 계산 (기존 방식)
        this.players.forEach(player => {
          if (!player.score) player.score = 0;
          player.score += Math.floor(Math.random() * 500) + 500;
        });
      }
      
      // 라운드 결과 표시
      setTimeout(() => {
        this.showRoundResults = true;
      }, 500);
    },
    
    // 라운드 변경 확장
    startNextRound() {
      this.closeRoundResults();
      
      if (this.currentRound >= this.totalRounds) {
        this.finishGame();
        return;
      }
      
      // 다음 라운드 설정
      this.currentRound++;
      this.roundEnded = false;
      this.hasSubmittedGuess = false;
      this.guessPosition = null;
      this.actualLocation = null;
      this.isLoading = true;
      
      // 새 라운드 데이터 가져오기
      this.fetchRoundData();
    },
    
    // 게임 종료
    finishGame() {
      // 최종 점수로 정렬
      this.players.sort((a, b) => b.totalScore - a.totalScore);
      
      // 결과 표시
      this.showGameResults = true;
    },
    
    // 다시 플레이
    restartGame() {
      this.showGameResults = false;
      this.returnToWaitingRoom();
    },
    
    // 라운드 결과 닫기
    closeRoundResults() {
      this.showRoundResults = false;
    },
    
    // 타이머 일시정지
    pauseTimer() {
      if (this.roundTimer) {
        clearInterval(this.roundTimer);
      }
    },
    
    // 타이머 재개
    resumeTimer() {
      if (!this.roundEnded) {
        this.startTimer();
      }
    },
    
    // 타이머 완전히 중단
    clearTimer() {
      if (this.roundTimer) {
        clearInterval(this.roundTimer);
        this.roundTimer = null;
      }
    },
    
    // 팀 모드에서 제출 버튼 클릭 시
    submitTeamGuess() {
      if (!this.canTeamSubmit) return;
      
      // 팀 투표 시작
      this.voteInitiator = this.currentUser;
      this.showTeamVoting = true;
      
      // 채팅 메시지 추가
      this.addTeamSystemMessage(
        this.currentUser.teamId,
        `${this.currentUser.nickname}님이 위치 제출을 제안했습니다. 투표해주세요!`
      );
      
      // 실제 구현에서는 서버로 투표 시작 이벤트 전송
    },
    
    // 투표 제출 처리
    handleVoteSubmission(vote) {
      // 실제 구현에서는 서버로 투표 결과 전송
      console.log(`${vote.userId}의 투표: ${vote.approved ? '찬성' : '반대'}`);
      
      // 테스트용 로직
      if (vote.approved) {
        this.votingResults.yes++;
      } else {
        this.votingResults.no++;
      }
      this.votingResults.total++;
      
      // 모든 팀원이 투표했는지 확인
      if (this.votingResults.total >= this.teamMembers.length) {
        this.finalizeTeamVoting();
      }
    },
    
    // 투표 완료 처리
    handleVotingComplete(result) {
      this.finalizeTeamVoting(result.approved);
    },
    
    // 팀 투표 종료 및 결과 처리
    finalizeTeamVoting(approved = null) {
      // 투표 결과가 전달되지 않은 경우 찬성표가 더 많은지 확인
      if (approved === null) {
        approved = this.votingResults.yes > this.votingResults.no;
      }
      
      // 투표 상태 초기화
      this.showTeamVoting = false;
      this.votingResults = { yes: 0, no: 0, total: 0 };
      
      // 투표 결과에 따라 처리
      if (approved) {
        // 찬성이 더 많으면 제출 처리
        this.addTeamSystemMessage(
          this.currentUser.teamId,
          '팀원들이 위치 제출에 동의했습니다!'
        );
        
        this.hasSubmittedGuess = true;
        
        // 라운드 종료 처리는 서버에서 처리 (여기서는 테스트를 위해 바로 처리)
        setTimeout(() => {
          this.endRound();
        }, 1000);
      } else {
        // 반대가 더 많으면 취소
        this.addTeamSystemMessage(
          this.currentUser.teamId,
          '팀원들이 위치 제출을 거부했습니다. 다시 시도해주세요.'
        );
      }
    },
    
    // 팀 채팅 메시지 추가
    addTeamSystemMessage(teamId, message) {
      if (!teamId) return;
      
      // 팀 채팅 메시지 초기화
      if (!this.teamChatMessages[teamId]) {
        this.$set(this.teamChatMessages, teamId, []);
      }
      
      // 시스템 메시지 추가
      this.teamChatMessages[teamId].push({
        id: `team-sys-${Date.now()}`,
        system: true,
        message: message,
        timestamp: new Date().toISOString()
      });
    },
    
    // 팀 채팅 메시지 전송
    sendTeamMessage(data) {
      const { teamId, message } = data;
      
      if (!teamId || !message.trim()) return;
      
      // 팀 채팅 메시지 초기화
      if (!this.teamChatMessages[teamId]) {
        this.$set(this.teamChatMessages, teamId, []);
      }
      
      // 메시지 추가
      this.teamChatMessages[teamId].push({
        id: `team-msg-${Date.now()}`,
        system: false,
        sender: this.currentUser.nickname,
        senderId: this.currentUser.id,
        senderLevel: this.currentUser.level,
        message: message,
        timestamp: new Date().toISOString()
      });
      
      // 실제 구현에서는 서버로 메시지 전송
    },
    
    // 팀 채팅 탭 변경
    setActiveTeamChat(teamId) {
      this.activeTeamChatId = teamId;
    },
    
    // 게임 초기화 확장
    initializeGame() {
      // 기존 초기화 로직
      this.currentRound = 1;
      this.roundEnded = false;
      this.hasSubmittedGuess = false;
      this.isLoading = true;
      this.guessPosition = null;
      
      // 팀 모드 관련 초기화
      if (this.isTeamMode) {
        // 테스트용 팀 데이터 사용 (실제로는 서버에서 받아옴)
        this.teams = JSON.parse(JSON.stringify(this.mockTeams));
        
        // 팀 점수 초기화
        this.teams.forEach(team => {
          team.totalScore = 0;
        });
        
        // 팀 채팅 메시지 초기화
        this.teamChatMessages = {};
        this.teams.forEach(team => {
          this.$set(this.teamChatMessages, team.id, []);
          
          // 시작 시스템 메시지 추가
          this.addTeamSystemMessage(
            team.id,
            '팀 채팅이 시작되었습니다. 팀원들과 소통하세요!'
          );
        });
        
        // 처음 활성화할 팀 채팅 설정
        this.activeTeamChatId = this.currentUser.teamId;
      }
      
      // 실제 구현에서는 서버에서 첫 라운드 데이터 가져오기
      this.fetchRoundData();
    },
    
    // 팀 색상 가져오기
    getTeamColor(teamId) {
      const colorMap = {
        'team1': 'blue',
        'team2': 'red',
        'team3': 'green',
        'team4': 'yellow'
      };
      
      return colorMap[teamId] || 'blue';
    },
  }
};
</script>

<style scoped>
.multiplayer-game-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.multiplayer-game {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f7fa;
}

/* 게임 헤더 스타일 */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.exit-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #f1f5f9;
  border: none;
  border-radius: 8px;
  color: #475569;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.exit-button:hover {
  background-color: #e2e8f0;
}

.room-info {
  margin-left: 1rem;
}

.room-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.game-mode {
  font-size: 0.875rem;
  color: #64748b;
}

.header-center {
  flex: 1;
  max-width: 400px;
  margin: 0 2rem;
}

.round-info {
  text-align: center;
}

.round-number {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 0.25rem;
}

.round-progress {
  height: 8px;
  background-color: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4f46e5, #3b82f6);
  border-radius: 4px;
  transition: width 0.5s ease-out;
}

/* 게임 컨텐츠 스타일 */
.game-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-panel {
  width: 250px;
  background-color: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 5;
}

.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

.game-view {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.map-container {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 300px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 5;
  transition: all 0.3s ease;
}

.map-container.expanded {
  width: 60%;
  height: 60%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.expand-map-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background-color: white;
  border: none;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  font-size: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.right-panel {
  width: 300px;
  background-color: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 5;
}

/* 게임 푸터 스타일 */
.game-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.guess-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #475569;
  font-weight: 500;
}

.guess-info i {
  color: #3b82f6;
}

.submit-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-button:hover:not(:disabled) {
  background-color: #4338ca;
}

.submit-button:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

/* 로딩 오버레이 스타일 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: white;
}

.loading-spinner i {
  font-size: 3rem;
}

/* 반응형 스타일 */
@media (max-width: 1200px) {
  .left-panel {
    width: 200px;
  }
  
  .right-panel {
    width: 250px;
  }
}

@media (max-width: 992px) {
  .game-content {
    flex-direction: column;
  }
  
  .left-panel, .right-panel {
    width: 100%;
    height: auto;
  }
  
  .main-panel {
    order: -1;
    height: 50vh;
  }
  
  .map-container.expanded {
    width: 80%;
    height: 80%;
  }
}

@media (max-width: 768px) {
  .game-header {
    flex-direction: column;
    padding: 0.5rem;
  }
  
  .header-center {
    margin: 1rem 0;
    max-width: 100%;
  }
  
  .header-right {
    align-self: flex-end;
  }
}

/* 팀 모드 관련 스타일 */
.team-chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.team-chat-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  overflow-x: auto;
  scrollbar-width: none;
}

.team-chat-tabs::-webkit-scrollbar {
  display: none;
}

.team-chat-tab {
  padding: 0.8rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.team-chat-tab::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: transparent;
  transition: background-color 0.2s ease;
}

.team-chat-tab.active::after {
  background-color: currentColor;
}

.team-chat-tab.blue {
  color: #3b82f6;
}

.team-chat-tab.red {
  color: #ef4444;
}

.team-chat-tab.green {
  color: #10b981;
}

.team-chat-tab.yellow {
  color: #f59e0b;
}

.team-chat-tabs .unread-badge {
  background-color: #ef4444;
  color: white;
  font-size: 0.7rem;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
}

.team-chat-content {
  flex: 1;
  overflow: hidden;
}
</style> 