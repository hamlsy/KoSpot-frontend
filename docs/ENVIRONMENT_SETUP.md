# 환경변수 관리 가이드

## 개요

KoSpot 프로젝트는 submodule을 활용하여 민감정보를 안전하게 관리합니다. 환경변수와 API 키 등의 민감정보는 `KoSpot-frontend-private` submodule에서 관리되며, 환경별로 다른 설정을 사용할 수 있습니다.

## 구조

```
KoSpot-frontend/
├── KoSpot-frontend-private/          # 민감정보 submodule
│   ├── .env                         # 현재 환경 설정
│   ├── .env.development             # 개발 환경 설정
│   ├── .env.staging                 # 스테이징 환경 설정
│   ├── .env.production              # 프로덕션 환경 설정
│   └── .gitignore                   # 민감정보 보호
├── config/
│   ├── env.template                 # 환경변수 템플릿
│   └── environments/                # 환경별 설정 파일들
├── src/core/config/
│   ├── environment.js               # 환경변수 관리 클래스
│   └── envLoader.js                 # 환경변수 로더
└── scripts/
    ├── setup-env.js                 # 환경변수 설정 스크립트
    ├── deploy.sh                    # Linux/Mac 배포 스크립트
    └── deploy.ps1                   # Windows 배포 스크립트
```

## 초기 설정

### 1. Submodule 초기화

```bash
# submodule 초기화 및 업데이트
git submodule update --init --recursive
```

### 2. 환경변수 설정

```bash
# 개발 환경 설정
node scripts/setup-env.js development setup

# 스테이징 환경 설정
node scripts/setup-env.js staging setup

# 프로덕션 환경 설정
node scripts/setup-env.js production setup
```

### 3. API 키 및 백엔드 URL 설정

submodule 디렉토리에서 실제 API 키와 백엔드 서버 주소를 설정합니다:

```bash
# submodule 디렉토리로 이동
cd KoSpot-frontend-private

# development.env 파일 편집 (개발 환경)
VUE_APP_API_BASE_URL=/api
VUE_APP_API_TARGET=http://localhost:8080
VUE_APP_WS_TARGET=ws://localhost:8080
VUE_APP_WS_URL=ws://localhost:8080/ws
VUE_APP_KAKAO_MAP_API_KEY=your_actual_kakao_map_api_key
VUE_APP_KAKAO_CLIENT_ID=your_actual_kakao_client_id
VUE_APP_GOOGLE_CLIENT_ID=your_actual_google_client_id

# production.env 파일 편집 (프로덕션 환경)
VUE_APP_API_BASE_URL=https://api.kospot.com/api
VUE_APP_WS_URL=wss://api.kospot.com/ws
# 프로덕션에서는 API_TARGET, WS_TARGET 불필요 (devServer 미실행)
VUE_APP_KAKAO_MAP_API_KEY=your_production_kakao_map_api_key
VUE_APP_KAKAO_CLIENT_ID=your_production_kakao_client_id
VUE_APP_GOOGLE_CLIENT_ID=your_production_google_client_id
```

### 4. API 설정 이해하기

#### 개발 환경 (Development)
- **VUE_APP_API_TARGET**: Vue devServer의 proxy가 요청을 전달할 실제 백엔드 서버 주소
- **VUE_APP_API_BASE_URL**: axios 클라이언트의 baseURL (보통 `/api`)
- 모든 API 요청은 `/api` prefix로 시작하며, proxy가 `API_TARGET`으로 전달

**동작 방식:**
```
axios 요청: GET /api/users
↓
Vue DevServer Proxy
↓
실제 전송: GET http://localhost:8080/api/users
```

#### 프로덕션 환경 (Production)
- **VUE_APP_API_BASE_URL**: 실제 백엔드 API의 전체 URL
- proxy가 없으므로 직접 백엔드 서버로 요청 전송

**동작 방식:**
```
axios 요청: GET /api/users
↓
실제 전송: GET https://api.kospot.com/api/users
```

## 환경변수 목록

### 필수 환경변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `VUE_APP_API_BASE_URL` | API 기본 URL | 개발: `/api`, 프로덕션: `https://api.kospot.com/api` |
| `VUE_APP_WS_URL` | WebSocket URL | `ws://localhost:8080/ws` |
| `VUE_APP_API_TARGET` | 백엔드 서버 주소 (개발환경 전용) | `http://localhost:8080` |
| `VUE_APP_WS_TARGET` | WebSocket 서버 주소 (개발환경 전용) | `ws://localhost:8080` |
| `VUE_APP_KAKAO_MAP_API_KEY` | 카카오 맵 API 키 | `your_kakao_map_api_key` |

### OAuth 설정

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `VUE_APP_KAKAO_CLIENT_ID` | 카카오 로그인 클라이언트 ID | `your_kakao_client_id` |
| `VUE_APP_GOOGLE_CLIENT_ID` | 구글 OAuth 클라이언트 ID | `your_google_client_id` |

### AWS 설정

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `VUE_APP_AWS_REGION` | AWS 리전 | `ap-northeast-2` |
| `VUE_APP_AWS_S3_BUCKET` | S3 버킷 이름 | `kospot-production-bucket` |

### 기능 플래그

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `VUE_APP_ENABLE_DEBUG` | 디버그 모드 활성화 | `true` (dev), `false` (prod) |
| `VUE_APP_ENABLE_ANALYTICS` | 분석 도구 활성화 | `false` (dev), `true` (prod) |

## 개발 워크플로우

### 1. 로컬 개발

```bash
# 개발 환경으로 실행
npm run serve:dev

# 또는 수동 설정
node scripts/setup-env.js development setup
npm run serve
```

### 2. 환경변수 검증

```bash
# 현재 환경변수 검증
npm run env:validate

# 환경변수 정보 확인
npm run env:show
```

### 3. 빌드

```bash
# 개발 환경 빌드
npm run build:dev

# 스테이징 환경 빌드
npm run build:staging

# 프로덕션 환경 빌드
npm run build:prod
```

## 배포

### GitHub Actions (자동 배포)

GitHub Actions를 통한 자동 배포가 설정되어 있습니다:

- **main 브랜치**: 프로덕션 환경으로 자동 배포
- **staging 브랜치**: 스테이징 환경으로 자동 배포
- **Pull Request**: 빌드 및 테스트만 수행

### 수동 배포

#### Linux/Mac

```bash
# 개발 환경 배포
./scripts/deploy.sh development

# 스테이징 환경 배포
./scripts/deploy.sh staging

# 프로덕션 환경 배포
./scripts/deploy.sh production
```

#### Windows

```powershell
# 개발 환경 배포
.\scripts\deploy.ps1 -Environment development

# 스테이징 환경 배포
.\scripts\deploy.ps1 -Environment staging

# 프로덕션 환경 배포
.\scripts\deploy.ps1 -Environment production
```

## 코드에서 환경변수 사용

### Vue 컴포넌트에서 사용

```javascript
// Composition API
import { inject } from 'vue'

export default {
  setup() {
    const env = inject('$env')
    
    // API 키 조회
    const kakaoMapApiKey = env.getApiKey('kakaoMap')
    
    // 환경 정보 조회
    const envInfo = env.getEnvironmentInfo()
    
    return {
      kakaoMapApiKey,
      envInfo
    }
  }
}
```

```javascript
// Options API
export default {
  mounted() {
    // 전역 환경설정 사용
    const kakaoMapApiKey = this.$env.getApiKey('kakaoMap')
    const apiBaseUrl = this.$env.get('apiBaseUrl')
  }
}
```

### 일반 JavaScript에서 사용

```javascript
import environmentConfig from '@/core/config/environment.js'

// 설정값 조회
const apiBaseUrl = environmentConfig.get('apiBaseUrl')
const kakaoMapApiKey = environmentConfig.getApiKey('kakaoMap')

// 환경 정보 조회
const envInfo = environmentConfig.getEnvironmentInfo()
```

## 보안 고려사항

### 1. 민감정보 보호

- 모든 민감정보는 submodule에서 관리
- submodule은 별도의 private 저장소로 관리
- 환경변수 파일은 `.gitignore`에 포함

### 2. 환경별 분리

- 개발, 스테이징, 프로덕션 환경을 완전히 분리
- 각 환경별로 다른 API 키와 설정 사용

### 3. 빌드 시 주의사항

- 빌드된 파일에 민감정보가 포함되지 않도록 주의
- 프론트엔드에서 사용되는 API 키는 공개되어도 안전한 키만 사용

## 문제 해결

### 환경변수가 로드되지 않는 경우

1. submodule이 제대로 초기화되었는지 확인:
   ```bash
   git submodule status
   ```

2. 환경변수 파일이 존재하는지 확인:
   ```bash
   ls KoSpot-frontend-private/.env*
   ```

3. 환경변수 설정 스크립트 실행:
   ```bash
   node scripts/setup-env.js development setup
   ```

### 빌드 실패 시

1. 환경변수 검증:
   ```bash
   npm run env:validate
   ```

2. 필요한 환경변수가 모두 설정되었는지 확인
3. API 키가 유효한지 확인

### 배포 실패 시

1. AWS 자격 증명 확인:
   ```bash
   aws sts get-caller-identity
   ```

2. S3 버킷 권한 확인
3. CloudFront 설정 확인 (사용하는 경우)

## 추가 리소스

- [Vue.js 환경변수 가이드](https://cli.vuejs.org/guide/mode-and-env.html)
- [AWS S3 정적 웹사이트 호스팅](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [Git Submodules 가이드](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
