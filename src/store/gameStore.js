import Vue from 'vue';
import { testData, individualTestData } from '@/components/game/multiplayerMode/MultiplayerGameTestData';

// 게임 상태 관리 스토어 생성
const gameStore = {
  state: Vue.observable({
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
  
  // 테스트용 데이터 로드
  loadTestData(isTeamMode = true) {
    console.log("테스트 데이터를 로드합니다")
    const data = isTeamMode ? testData : individualTestData;
    this.state.roomData = data.roomData;
    this.state.currentUser = data.currentUser;
    this.state.players = data.players;
    this.state.teams = data.teams || [];
    this.state.chatMessages = data.chatMessages || [];
    this.state.teamChatMessages = data.teamChatMessages || {};
  },
  
  // 게임 상태 초기화
  initGame() {
    this.state.currentRound = 1;
    this.state.roundEnded = false;
    this.state.hasSubmittedGuess = false;
    this.state.showRoundResults = false;
    this.state.showGameResults = false;
    this.state.guessPosition = null;
    this.state.isLoading = false;
    // this.state.players = [];
    // this.state.playersGuesses = [];
    // this.state.teamPlayers = [];
    
  },
  
  // 라운드 종료 처리
  endGameRound() {
    this.state.playersGuesses = [];
    this.state.players = [];
    this.state.roundEnded = true;
    
    // 실제 로직에서는 서버에서 계산된 점수 받아옴
    // 여기서는 테스트를 위해 간단히 구현
    if (this.state.roomData.matchType === 'team') {
      this.state.teams.forEach(team => {
        const teamPlayers = this.state.players.filter(p => p.teamId === team.id);
        const teamScore = Math.floor(Math.random() * 500) + 500;
        team.totalScore += teamScore;
        
        teamPlayers.forEach(player => {
          const playerIndex = this.state.players.findIndex(p => p.id === player.id);
          if (playerIndex !== -1) {
            if (!this.state.players[playerIndex].score) {
              this.state.players[playerIndex].score = 0;
            }
            this.state.players[playerIndex].score += Math.floor(teamScore / teamPlayers.length);
          }
        });
      });
    } else {
      this.state.players.forEach((player, index) => {
        if (!player.score) {
          this.state.players[index].score = 0;
        }
        this.state.players[index].score += Math.floor(Math.random() * 500) + 500;
      });
    }
    
    this.state.showRoundResults = true;
  },
  
  // 다음 라운드 시작
  startNextRound() {
    this.state.showRoundResults = false;
    
    if (this.state.currentRound >= this.state.totalRounds) {
      this.finishGame();
      return;
    }
    
    this.state.currentRound++;
    this.state.roundEnded = false;
    this.state.hasSubmittedGuess = false;
    this.state.guessPosition = null;
    this.state.actualLocation = null;
    this.state.isLoading = true;
  },
  
  // 게임 종료
  finishGame() {
    // 최종 점수로 정렬
    this.state.players.sort((a, b) => b.totalScore - a.totalScore);
    this.state.showGameResults = true;
  },
  
  // 추측 제출
  submitGuess() {
    this.state.hasSubmittedGuess = true;
  },
  
  // 팀 투표 시작
  startTeamVoting(initiator) {
    this.state.showTeamVoting = true;
    this.state.voteInitiator = initiator;
    this.state.votingResults = { yes: 0, no: 0, total: 0 };
  },
  
  // 투표 제출
  submitVote(isApproved) {
    if (isApproved) {
      this.state.votingResults.yes++;
    } else {
      this.state.votingResults.no++;
    }
    this.state.votingResults.total++;
  },
  
  // 투표 완료
  finalizeVoting(approved = null) {
    if (approved === null) {
      approved = this.state.votingResults.yes > this.state.votingResults.no;
    }
    
    this.state.showTeamVoting = false;
    
    return approved;
  },
  
  // 챗 메시지 추가
  addChatMessage(message, isSys = false) {
    this.state.chatMessages.push({
      id: `chat-${Date.now()}`,
      sender: isSys ? '시스템' : this.state.currentUser.nickname,
      message: message,
      timestamp: new Date(),
      system: isSys
    });
  },
  
  // 팀 챗 메시지 추가
  addTeamChatMessage(teamId, message, isSys = false) {
    if (!teamId) return;
    
    if (!this.state.teamChatMessages[teamId]) {
      Vue.set(this.state.teamChatMessages, teamId, []);
    }
    
    this.state.teamChatMessages[teamId].push({
      id: `team-${isSys ? 'sys' : 'msg'}-${Date.now()}`,
      system: isSys,
      sender: isSys ? null : this.state.currentUser.nickname,
      senderId: isSys ? null : this.state.currentUser.id,
      senderLevel: isSys ? null : this.state.currentUser.level,
      message: message,
      timestamp: new Date().toISOString()
    });
  }
};

export default gameStore; 