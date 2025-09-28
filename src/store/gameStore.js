import { reactive } from 'vue';
import { testData, soloTestData } from '@/store/MultiplayerGameTestData'

// 게임 상태 관리 스토어 생성
const gameStore = {
  state: reactive({
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
    canSubmitGuess: true,
    
    // 팀 투표 통합 상태 객체
    teamVoting: null
  }),
  
  // 테스트용 데이터 로드
  loadTestData(isTeamMode = true) {
    console.log("테스트 데이터를 로드합니다")
    const data = isTeamMode ? testData : soloTestData;
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
  },
  
  // 라운드 종료 처리
  endGameRound() {
    this.state.playersGuesses = [];
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
  startTeamVoting(initiator, position) {
    // 투표 상태 초기화
    this.state.canSubmitGuess = false;
    
    // 팀 투표 객체 생성
    this.state.teamVoting = {
      active: true,
      initiatorId: initiator.id,
      teamId: initiator.teamId,
      position: position,
      startTime: new Date(),
      timeoutSeconds: 30, // 30초 타임아웃
      votes: [{
        playerId: initiator.id,
        playerName: initiator.nickname,
        choice: 'approve', // 'approve' 또는 'reject'
        timestamp: new Date()
      }]
    };
    
    // 팀 채팅에 투표 시작 메시지 추가
    this.addTeamChatMessage(initiator.teamId, `${initiator.nickname}님이 위치 제출을 제안했습니다. 투표해주세요!`, true);
  },
  
  // 투표 제출
  submitVote(choice) { // choice: 'approve' 또는 'reject'
    if (!this.state.teamVoting || !this.state.teamVoting.active) return false;
    
    // 이미 투표한 경우 처리하지 않음
    const alreadyVoted = this.state.teamVoting.votes.some(vote => vote.playerId === this.state.currentUser.id);
    if (alreadyVoted) return false;
    
    // 투표 추가
    this.state.teamVoting.votes.push({
      playerId: this.state.currentUser.id,
      playerName: this.state.currentUser.nickname,
      choice: choice,
      timestamp: new Date()
    });
    
    // 팀 채팅에 투표 메시지 추가
    const voteMessage = choice === 'approve' ? '찬성' : '반대';
    this.addTeamChatMessage(this.state.teamVoting.teamId, `${this.state.currentUser.nickname}님이 ${voteMessage}했습니다.`, true);
    
    // 투표 완료 여부 확인
    const teamSize = this.getTeamSize(this.state.teamVoting.teamId);
    const votesCount = this.state.teamVoting.votes.length;
    
    // 모든 팀원이 투표했으면 자동으로 결과 처리
    if (votesCount >= teamSize) {
      return this.checkVotingResult();
    }
    
    return true;
  },
  
  // 투표 결과 확인
  checkVotingResult() {
    if (!this.state.teamVoting || !this.state.teamVoting.active) return false;
    
    // 찬성, 반대 투표 수 계산
    const approveVotes = this.state.teamVoting.votes.filter(vote => vote.choice === 'approve').length;
    const rejectVotes = this.state.teamVoting.votes.filter(vote => vote.choice === 'reject').length;
    
    // 과반수 이상이 찬성한 경우 승인
    const teamSize = this.getTeamSize(this.state.teamVoting.teamId);
    const approved = approveVotes > (teamSize / 2);
    
    return this.finalizeVoting(approved);
  },
  
  // 투표 완료
  finalizeVoting(approved = null) {
    if (!this.state.teamVoting) return false;
    
    const teamId = this.state.teamVoting.teamId;
    const position = this.state.teamVoting.position;
    
    // 승인된 경우 위치 설정
    if (approved) {
      this.state.guessPosition = position;
      this.addTeamChatMessage(teamId, '팀 투표가 승인되었습니다. 위치가 제출됩니다.', true);
    } else {
      this.addTeamChatMessage(teamId, '팀 투표가 거부되었습니다. 위치 제출이 취소됩니다.', true);
    }
    
    // 투표 상태 초기화
    this.state.canSubmitGuess = true;
    this.state.teamVoting = null;
    
    return approved;
  },
  
  // 투표 취소
  cancelVoting() {
    if (!this.state.teamVoting) return false;
    
    const teamId = this.state.teamVoting.teamId;
    const initiatorName = this.state.players.find(p => p.id === this.state.teamVoting.initiatorId)?.nickname || '제안자';
    
    // 팀 채팅에 취소 메시지 추가
    this.addTeamChatMessage(teamId, `${initiatorName}님이 투표를 취소했습니다.`, true);
    
    // 투표 상태 초기화
    this.state.canSubmitGuess = true;
    this.state.teamVoting = null;
    
    return true;
  },
  
  // 팀 크기 가져오기
  getTeamSize(teamId) {
    return this.state.players.filter(player => player.teamId === teamId).length;
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
      this.state.teamChatMessages[teamId] = [];
    }
    
    this.state.teamChatMessages[teamId].push({
      id: `team-${isSys ? 'sys' : 'msg'}-${Date.now()}`,
      system: isSys,
      sender: isSys ? null : this.state.currentUser.nickname,
      senderId: isSys ? null : this.state.currentUser.id,
      message: message,
      timestamp: new Date().toISOString()
    });
  }
};

export default gameStore; 