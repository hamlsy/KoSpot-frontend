// src/stores/game.js
import { defineStore } from 'pinia';

// 게임 스토어 정의 (Vuex game 모듈에 해당)
export const useGameStore = defineStore('game', {
  // 상태 (Vuex state)
  state: () => ({
    // 게임 공통 상태
    roomData: null,
    currentUser: null,
    players: [],
    teams: [],
    chatMessages: [],
    teamChatMessages: {},
    playersGuesses: [],
    
    //순위
    topPlayer: {},
    
    // 게임 플레이 상태
    currentRound: 1,
    totalRounds: 5,
    remainingTime: 120,
    currentLocation: null,
    actualLocation: null,
    locationInfo: {
      name: '',
      description: '',
      image: '',
      fact: ''
    },
    guessPosition: null,
    hasSubmittedGuess: false,
    roundEnded: false,
    showRoundResults: false,
    showGameResults: false,
    isLoading: false,
    
    // 팀 모드 관련 상태
    showTeamVoting: false,
    voteInitiator: null,
    votingResults: {
      yes: 0,
      no: 0,
      total: 0
    }
  }),
  
  // 액션 (Vuex actions + mutations)
  actions: {
    // 테스트 데이터 설정
    setTestData({ isTeamMode }) {
      console.log("테스트 데이터를 로드합니다");
      const data = isTeamMode ? testData : individualTestData;
      this.roomData = data.roomData;
      this.currentUser = data.currentUser;
      this.players = data.players;
      this.teams = data.teams || [];
      this.chatMessages = data.chatMessages || [];
      this.teamChatMessages = data.teamChatMessages || {};
    },
    
    // 게임 상태 초기화
    initGame() {
      this.currentRound = 1;
      this.roundEnded = false;
      this.hasSubmittedGuess = false;
      this.showRoundResults = false;
      this.showGameResults = false;
      this.guessPosition = null;
      this.isLoading = false;
    },
    
    // 라운드 종료 처리
    endGameRound() {
      this.playersGuesses = [];
      this.roundEnded = true;
      
      // 실제 로직에서는 서버에서 계산된 점수 받아옴
      // 여기서는 테스트를 위해 간단히 구현
      if (this.roomData.matchType === 'team') {
        this.teams.forEach(team => {
          const teamPlayers = this.players.filter(p => p.teamId === team.id);
          const teamScore = Math.floor(Math.random() * 500) + 500;
          team.totalScore += teamScore;
          
          teamPlayers.forEach(player => {
            const playerIndex = this.players.findIndex(p => p.id === player.id);
            if (playerIndex !== -1) {
              if (!this.players[playerIndex].score) {
                this.players[playerIndex].score = 0;
              }
              this.players[playerIndex].score += Math.floor(teamScore / teamPlayers.length);
            }
          });
        });
      } else {
        this.players.forEach((player, index) => {
          if (!player.score) {
            this.players[index].score = 0;
          }
          this.players[index].score += Math.floor(Math.random() * 500) + 500;
        });
      }
      
      this.showRoundResults = true;
    },
    
    // 다음 라운드 시작
    startNextRound() {
      this.showRoundResults = false;
      this.currentRound++;
      this.roundEnded = false;
      this.hasSubmittedGuess = false;
      this.guessPosition = null;
      this.actualLocation = null;
      this.isLoading = true;
      
      if (this.currentRound > this.totalRounds) {
        this.finishGame();
      }
    },
    
    // 게임 종료
    finishGame() {
      // 최종 점수로 정렬
      this.players.sort((a, b) => b.totalScore - a.totalScore);
      this.showGameResults = true;
    },
    
    // 추측 제출
    submitGuess() {
      this.hasSubmittedGuess = true;
    },
    
    // 팀 투표 시작
    startTeamVoting(initiator) {
      this.showTeamVoting = true;
      this.voteInitiator = initiator;
      this.votingResults = { yes: 0, no: 0, total: 0 };
    },
    
    // 투표 제출
    submitVote(isApproved) {
      if (isApproved) {
        this.votingResults.yes++;
      } else {
        this.votingResults.no++;
      }
      this.votingResults.total++;
    },
    
    // 투표 완료
    finalizeVoting() {
      const approved = this.votingResults.yes > this.votingResults.no;
      this.showTeamVoting = false;
      return approved;
    },
    
    // 챗 메시지 추가
    addChatMessage({ message, isSys = false }) {
      this.chatMessages.push({
        id: `chat-${Date.now()}`,
        sender: isSys ? '시스템' : this.currentUser.nickname,
        message: message,
        timestamp: new Date(),
        system: isSys
      });
    },
    
    // 팀 챗 메시지 추가
    addTeamChatMessage({ teamId, message, isSys = false }) {
      if (!teamId) return;
      
      if (!this.teamChatMessages[teamId]) {
        this.teamChatMessages[teamId] = [];
      }
      
      this.teamChatMessages[teamId].push({
        id: `team-${isSys ? 'sys' : 'msg'}-${Date.now()}`,
        system: isSys,
        sender: isSys ? null : this.currentUser.nickname,
        senderId: isSys ? null : this.currentUser.id,
        message: message,
        timestamp: new Date().toISOString()
      });
    },
    
    // Vuex 액션들을 Pinia 액션으로 변환
    loadTestData(isTeamMode = true) {
      this.setTestData({ isTeamMode });
    }
  },
  
  // 게터 (Vuex getters)
  getters: {
    // 현재 라운드 정보
    currentRoundInfo: (state) => {
      return {
        current: state.currentRound,
        total: state.totalRounds
      };
    },
    
    // 플레이어 점수 정렬
    sortedPlayers: (state) => {
      return [...state.players].sort((a, b) => (b.score || 0) - (a.score || 0));
    },
    
    // 팀 점수 정렬
    sortedTeams: (state) => {
      return [...state.teams].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    },
    
    // 현재 사용자 팀
    currentUserTeam: (state) => {
      if (!state.currentUser || !state.teams.length) return null;
      return state.teams.find(team => team.id === state.currentUser.teamId);
    },
    
    // 팀 채팅 메시지
    teamChatForCurrentUser: (state) => {
      if (!state.currentUser || !state.currentUser.teamId) return [];
      return state.teamChatMessages[state.currentUser.teamId] || [];
    }
  }
});
