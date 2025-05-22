// 멀티플레이어 게임용 테스트 데이터
/**
 * 테스트 데이터
 * @property {Object} roomData - 게임 방 정보
 * @property {Object} currentUser - 현재 사용자 정보
 * @property {Array<Object>} players - 플레이어 목록
 * @property {Array<Object>} teams - 팀 정보
 * @property {Array<Object>} locations - 위치 데이터
 * @property {Array<Object>} chatMessages - 채팅 메시지
 * @property {Object} teamChatMessages - 팀별 채팅 메시지
 */
export const testData = {
  // 게임 방 정보
  roomData: {
    id: 'room123',
    name: '즐거운 협동전 게임방',
    gameMode: '로드뷰',
    matchType: 'team', // 'individual' 또는 'team'
    region: '서울',
    maxPlayers: 8,
    rounds: 5,
    timeLimit: 120,
    isPrivate: false,
    password: ''
  },
  
  // 현재 사용자 정보
  currentUser: {
    id: 'user123',
    nickname: '김아무개',
    profileImage: null,
    isHost: true,
    isReady: false,
    teamId: 'team1'
  },
  
  // 플레이어 목록
  players: [
    {
      id: 'user123',
      nickname: '테스트 방장',
      profileImage: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
      isHost: true,
      equippedMarker: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
      isReady: true,
      teamId: 'team1',
      score: 0,
      totalScore: 0,
      guessPosition: null,
      distance: null,
      hasSubmitted: false
    },
    {
      id: 'user456',
      nickname: '테스트플레이어2',
      profileImage: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
      equippedMarker: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
      isHost: false,
      isReady: true,
      teamId: 'team1',
      score: 0,
      totalScore: 0,
      guessPosition: null,
      distance: null,
      hasSubmitted: false
    },
    {
      id: 'user789',
      nickname: '테스트플레이어테스트플레이어테스트플레이어',
      profileImage: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
      equippedMarker: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
      isHost: false,
      isReady: true,
      teamId: 'team2',
      score: 0,
      totalScore: 0,
      guessPosition: null,
      distance: null,
      hasSubmitted: false
    },
    {
      id: 'user101',
      nickname: '테스트플레이어3',
      profileImage: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
      equippedMarker: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
      isHost: false,
      isReady: true,
      teamId: 'team2',
      score: 0,
      totalScore: 0,
      guessPosition: null,
      distance: null,
      hasSubmitted: false
    }
  ],
  
  // 팀 정보
  teams: [
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
  ],
  
  // 위치 데이터
  locations: [
    { 
      lat: 37.5665, 
      lng: 126.9780, 
      name: '서울 광화문', 
      description: '서울 중심부에 위치한 역사적 장소',
      image: '/assets/locations/location1.jpg',
      fact: '광화문은 조선시대 경복궁의 남쪽에 있는 정문입니다.'
    },
    { 
      lat: 35.1796, 
      lng: 129.0756, 
      name: '부산 해운대', 
      description: '부산의 유명한 해변',
      image: '/assets/locations/location2.jpg',
      fact: '해운대는 대한민국에서 가장 유명한 해변 중 하나입니다.'
    },
    { 
      lat: 33.2496, 
      lng: 126.5100, 
      name: '제주 성산일출봉', 
      description: '제주의 아름다운 일출 명소',
      image: '/assets/locations/location3.jpg',
      fact: '성산일출봉은 유네스코 세계자연유산으로 등재되어 있습니다.'
    },
    { 
      lat: 37.2758, 
      lng: 127.0094, 
      name: '수원화성', 
      description: '조선시대의 유네스코 세계문화유산',
      image: '/assets/locations/location4.jpg',
      fact: '수원화성은 정조대왕이 1796년에 완공한 성곽입니다.'
    },
    { 
      lat: 36.3504, 
      lng: 127.3845, 
      name: '대전 엑스포', 
      description: '첨단 과학의 중심지',
      image: '/assets/locations/location5.jpg',
      fact: '대전 엑스포는 1993년 세계박람회가 열린 장소입니다.'
    }
  ],
  
  // 채팅 메시지
  chatMessages: [
    {
      id: 'chat1',
      sender: '테스트플레이어1',
      message: '게임이 시작되었습니다! 행운을 빕니다.',
      timestamp: new Date(),
      system: true
    },
    {
      id: 'chat2',
      sender: '테스트플레이어3',
      message: '안녕하세요! 다들 준비되셨나요?',
      timestamp: new Date(),
      system: false
    },
    {
      id: 'chat3',
      sender: '테스트플레이어2',
      message: '네! 열심히 해봐요~',
      timestamp: new Date(),
      system: false
    }
  ],
  
  // 팀별 채팅 메시지
  teamChatMessages: {
    team1: [
      {
        id: 'team1-chat1',
        system: true,
        message: '팀 채팅이 시작되었습니다. 팀원들과 소통하세요!',
        timestamp: new Date().toISOString()
      },
      {
        id: 'team1-chat2',
        system: false,
        sender: '김코스팟',
        senderId: 'user123',
        message: '안녕하세요 팀원! 잘 부탁드려요.',
        timestamp: new Date().toISOString()
      },
      {
        id: 'team1-chat3',
        system: false,
        sender: '박지금',
        senderId: 'user456',
        message: '네! 같이 열심히 해봐요.',
        timestamp: new Date().toISOString()
      }
    ],
    team2: [
      {
        id: 'team2-chat1',
        system: true,
        message: '팀 채팅이 시작되었습니다. 팀원들과 소통하세요!',
        timestamp: new Date().toISOString()
      },
      {
        id: 'team2-chat2',
        system: false,
        sender: '테스트플레이어1',
        senderId: 'user789',
        message: '우리팀 화이팅!',
        timestamp: new Date().toISOString()
      }
    ]
  }
};

// 개인전 모드 게임 데이터
export const individualTestData = {
  roomData: {
    ...testData.roomData,
    name: '개인전 게임방',
    matchType: 'individual'
  },
  
  currentUser: {
    ...testData.currentUser,
    teamId: null
  },
  
  players: testData.players.map(player => ({
    ...player,
    teamId: null
  })),
  
  locations: testData.locations,
  chatMessages: testData.chatMessages
};

// 위치 관련 함수
export function getRandomLocation() {
  const locations = testData.locations;
  const randomIndex = Math.floor(Math.random() * locations.length);
  return locations[randomIndex];
}

// 점수 계산 함수 (거리 기반)
export function calculateScore(distance) {
  if (distance < 1) return 1000;
  if (distance < 5) return 750;
  if (distance < 10) return 500;
  if (distance < 20) return 250;
  return 100;
}

// 거리 계산 함수 (두 좌표 사이의 대략적인 거리, km 단위)
export function calculateDistance(pos1, pos2) {
  const R = 6371; // 지구 반경 (km)
  const dLat = toRad(pos2.lat - pos1.lat);
  const dLng = toRad(pos2.lng - pos1.lng);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(pos1.lat)) * Math.cos(toRad(pos2.lat)) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

function toRad(value) {
  return value * Math.PI / 180;
} 