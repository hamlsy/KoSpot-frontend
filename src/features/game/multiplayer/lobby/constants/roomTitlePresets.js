const ROOM_TITLE_PRESETS = [
  "로드뷰 정복자들의 방",
  "첫판은 가볍게",
  "정답 핀셋 모드",
  "지금 바로 한판",
  "실력 올리는 연습방",
  "끝까지 가는 집중방",
  "빠른 매칭 환영",
  "초보도 환영해요",
  "랭크 감각 예열중",
  "오늘도 정확하게",
  "감으로 찍지 말기",
  "길찾기 장인 모여라",
];

export function getRandomRoomTitle() {
  const index = Math.floor(Math.random() * ROOM_TITLE_PRESETS.length);
  return ROOM_TITLE_PRESETS[index];
}

export { ROOM_TITLE_PRESETS };
