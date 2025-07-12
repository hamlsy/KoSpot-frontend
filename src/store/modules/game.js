import { reactive } from 'vue';
import { testData, individualTestData } from '../MultiplayerGameTestData';

// 게임 상태 관리 스토어 모듈
export default {
  namespaced: true,
  
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
  
  mutations: {
    // 테스트 데이터 설정
    SET_TEST_DATA(state, { isTeamMode }) {
      console.log("테스트 데이터를 로드합니다");
      const data = isTeamMode ? testData : individualTestData;
      state.roomData = data.roomData;
      state.currentUser = data.currentUser;
      state.players = data.players;
      state.teams = data.teams || [];
      state.chatMessages = data.chatMessages || [];
      state.teamChatMessages = data.teamChatMessages || {};
    },
    
    // 게임 상태 초기화
    INIT_GAME(state) {
      state.currentRound = 1;
      state.roundEnded = false;
      state.hasSubmittedGuess = false;
      state.showRoundResults = false;
      state.showGameResults = false;
      state.guessPosition = null;
      state.isLoading = false;
    },
    
    // 라운드 종료 처리
    END_GAME_ROUND(state) {
      state.playersGuesses = [];
      state.roundEnded = true;
      
      // 실제 로직에서는 서버에서 계산된 점수 받아옴
      // 여기서는 테스트를 위해 간단히 구현
      if (state.roomData.matchType === 'team') {
        state.teams.forEach(team => {
          const teamPlayers = state.players.filter(p => p.teamId === team.id);
          const teamScore = Math.floor(Math.random() * 500) + 500;
          team.totalScore += teamScore;
          
          teamPlayers.forEach(player => {
            const playerIndex = state.players.findIndex(p => p.id === player.id);
            if (playerIndex !== -1) {
              if (!state.players[playerIndex].score) {
                state.players[playerIndex].score = 0;
              }
              state.players[playerIndex].score += Math.floor(teamScore / teamPlayers.length);
            }
          });
        });
      } else {
        state.players.forEach((player, index) => {
          if (!player.score) {
            state.players[index].score = 0;
          }
          state.players[index].score += Math.floor(Math.random() * 500) + 500;
        });
      }
      
      state.showRoundResults = true;
    },
    
    // 다음 라운드 시작
    START_NEXT_ROUND(state) {
      state.showRoundResults = false;
      state.currentRound++;
      state.roundEnded = false;
      state.hasSubmittedGuess = false;
      state.guessPosition = null;
      state.actualLocation = null;
      state.isLoading = true;
    },
    
    // 게임 종료
    FINISH_GAME(state) {
      // 최종 점수로 정렬
      state.players.sort((a, b) => b.totalScore - a.totalScore);
      state.showGameResults = true;
    },
    
    // 추측 제출
    SUBMIT_GUESS(state) {
      state.hasSubmittedGuess = true;
    },
    
    // 팀 투표 시작
    START_TEAM_VOTING(state, initiator) {
      state.showTeamVoting = true;
      state.voteInitiator = initiator;
      state.votingResults = { yes: 0, no: 0, total: 0 };
    },
    
    // 투표 제출
    SUBMIT_VOTE(state, isApproved) {
      if (isApproved) {
        state.votingResults.yes++;
      } else {
        state.votingResults.no++;
      }
      state.votingResults.total++;
    },
    
    // 투표 완료
    FINALIZE_VOTING(state, approved = null) {
      state.showTeamVoting = false;
    },
    
    // 챗 메시지 추가
    ADD_CHAT_MESSAGE(state, { message, isSys }) {
      state.chatMessages.push({
        id: `chat-${Date.now()}`,
        sender: isSys ? '시스템' : state.currentUser.nickname,
        message: message,
        timestamp: new Date(),
        system: isSys
      });
    },
    
    // 팀 챗 메시지 추가
    ADD_TEAM_CHAT_MESSAGE(state, { teamId, message, isSys }) {
      if (!teamId) return;
      
      if (!state.teamChatMessages[teamId]) {
        state.teamChatMessages = reactive({
          ...state.teamChatMessages,
          [teamId]: []
        });
      }
      
      state.teamChatMessages[teamId].push({
        id: `team-${isSys ? 'sys' : 'msg'}-${Date.now()}`,
        system: isSys,
        sender: isSys ? null : state.currentUser.nickname,
        senderId: isSys ? null : state.currentUser.id,
        message: message,
        timestamp: new Date().toISOString()
      });
    }
  },
  
  actions: {
    // 테스트용 데이터 로드
    loadTestData({ commit }, isTeamMode = true) {
      commit('SET_TEST_DATA', { isTeamMode });
    },
    
    // 게임 상태 초기화
    initGame({ commit }) {
      commit('INIT_GAME');
    },
    
    // 라운드 종료 처리
    endGameRound({ commit }) {
      commit('END_GAME_ROUND');
    },
    
    // 다음 라운드 시작
    startNextRound({ commit, state, dispatch }) {
      commit('START_NEXT_ROUND');
      
      if (state.currentRound > state.totalRounds) {
        dispatch('finishGame');
      }
    },
    
    // 게임 종료
    finishGame({ commit }) {
      commit('FINISH_GAME');
    },
    
    // 추측 제출
    submitGuess({ commit }) {
      commit('SUBMIT_GUESS');
    },
    
    // 팀 투표 시작
    startTeamVoting({ commit }, initiator) {
      commit('START_TEAM_VOTING', initiator);
    },
    
    // 투표 제출
    submitVote({ commit }, isApproved) {
      commit('SUBMIT_VOTE', isApproved);
    },
    
    // 투표 완료
    finalizeVoting({ commit, state }) {
      const approved = state.votingResults.yes > state.votingResults.no;
      commit('FINALIZE_VOTING', approved);
      return approved;
    },
    
    // 챗 메시지 추가
    addChatMessage({ commit }, { message, isSys = false }) {
      commit('ADD_CHAT_MESSAGE', { message, isSys });
    },
    
    // 팀 챗 메시지 추가
    addTeamChatMessage({ commit }, { teamId, message, isSys = false }) {
      commit('ADD_TEAM_CHAT_MESSAGE', { teamId, message, isSys });
    }
  },
  
  getters: {
    // 현재 라운드 정보
    currentRoundInfo: state => {
      return {
        current: state.currentRound,
        total: state.totalRounds,
        progress: (state.currentRound / state.totalRounds) * 100
      };
    },
    
    // 플레이어 정보
    playerById: state => id => {
      return state.players.find(player => player.id === id) || null;
    },
    
    // 팀 정보
    teamById: state => id => {
      return state.teams.find(team => team.id === id) || null;
    },
    
    // 정렬된 플레이어 목록 (점수 기준)
    sortedPlayers: state => {
      return [...state.players].sort((a, b) => (b.score || 0) - (a.score || 0));
    },
    
    // 정렬된 팀 목록 (점수 기준)
    sortedTeams: state => {
      return [...state.teams].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    }
  }
};
