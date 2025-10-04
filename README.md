# KoSpot Frontend

Vue 3 기반의 한국 관광지 추천 게임 플랫폼입니다.

## 기술 스택

- **Frontend**: Vue 3 (Composition API), TypeScript
- **Build Tool**: Vite
- **Styling**: SCSS/CSS
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **Real-time Communication**: WebSocket (STOMP)

## 프로젝트 구조

```
src/
├── core/                    # 핵심 기능
│   ├── api/                # API 클라이언트
│   ├── components/         # 공통 컴포넌트
│   ├── composables/        # Vue 3 Composables
│   ├── config/             # 환경설정 관리
│   ├── constants/          # 상수 정의
│   └── utils/              # 유틸리티 함수
├── features/               # 기능별 모듈
│   ├── auth/               # 인증 관련
│   ├── game/               # 게임 관련
│   ├── main/               # 메인 페이지
│   ├── notice/             # 공지사항
│   ├── shop/               # 상점
│   └── user/               # 사용자 관리
├── router/                 # 라우팅 설정
├── store/                  # 상태 관리
└── shared/                 # 공유 리소스
    ├── assets/             # 이미지, 스타일 등
    ├── types/              # TypeScript 타입
    └── utils/              # 공통 유틸리티
```

## 환경변수 관리

이 프로젝트는 submodule을 활용하여 민감정보를 안전하게 관리합니다.

### 초기 설정

```bash
# 1. 의존성 설치
npm install

# 2. submodule 초기화
git submodule update --init --recursive

# 3. 환경변수 설정
node scripts/setup-env.js development setup
```

### 환경변수 설정

민감정보는 `KoSpot-frontend-private` submodule에서 관리됩니다:

```bash
# submodule 디렉토리로 이동
cd KoSpot-frontend-private

# .env 파일 편집하여 실제 API 키 설정
VUE_APP_KAKAO_MAP_API_KEY=your_actual_kakao_map_api_key
VUE_APP_KAKAO_CLIENT_ID=your_actual_kakao_client_id
VUE_APP_GOOGLE_CLIENT_ID=your_actual_google_client_id
```

자세한 내용은 [환경변수 관리 가이드](docs/ENVIRONMENT_SETUP.md)를 참조하세요.

## 개발

### 개발 서버 실행

```bash
# 개발 환경으로 실행
npm run serve:dev

# 또는 기본 실행
npm run serve
```

### 빌드

```bash
# 개발 환경 빌드
npm run build:dev

# 스테이징 환경 빌드
npm run build:staging

# 프로덕션 환경 빌드
npm run build:prod
```

### 코드 품질 관리

```bash
# 린트 검사
npm run lint

# 코드 최적화
npm run optimize
```

## 배포

### GitHub Actions (자동 배포)

- **main 브랜치**: 프로덕션 환경으로 자동 배포
- **staging 브랜치**: 스테이징 환경으로 자동 배포

### 수동 배포

#### Windows

```powershell
# 개발 환경 배포
.\scripts\deploy.ps1 -Environment development

# 프로덕션 환경 배포
.\scripts\deploy.ps1 -Environment production
```

#### Linux/Mac

```bash
# 개발 환경 배포
./scripts/deploy.sh development

# 프로덕션 환경 배포
./scripts/deploy.sh production
```

## 주요 기능

### 게임 모드

1. **싱글 플레이어**
   - 포토 게임: 사진으로 장소 맞추기
   - 로드뷰 게임: 스트리트뷰로 장소 찾기

2. **멀티플레이어**
   - 실시간 멀티플레이어 게임
   - 채팅 시스템
   - 게임 로비

### 사용자 관리

- 카카오/구글 소셜 로그인
- 사용자 프로필 관리
- 친구 시스템
- 인벤토리 관리

### 상점 시스템

- 코인 구매
- 아이템 상점
- 관리자 패널

## API 키 설정

다음 서비스들의 API 키가 필요합니다:

1. **카카오 개발자 콘솔**
   - 카카오 맵 API
   - 카카오 로그인 API

2. **구글 클라우드 콘솔**
   - Google OAuth API
   - Google Maps API (필요시)

3. **AWS**
   - S3 버킷 (정적 웹사이트 호스팅)
   - CloudFront (CDN, 선택사항)

## 브랜치 전략

- `main`: 프로덕션 환경
- `staging`: 스테이징 환경
- `develop`: 개발 환경
- `feature/*`: 기능 개발 브랜치

## 기여 가이드

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 연락처

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.