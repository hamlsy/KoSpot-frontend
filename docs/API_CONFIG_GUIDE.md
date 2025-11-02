# API 설정 가이드

## 📌 개요

KoSpot 프론트엔드의 백엔드 API 연결 설정이 환경변수로 관리됩니다.
모든 API 요청은 `/api` prefix를 포함해야 합니다.

## 🔧 환경변수 설정

### 개발 환경 (development.env)

```bash
# axios 클라이언트 baseURL
VUE_APP_API_BASE_URL=/api

# Vue DevServer Proxy Target (로컬 또는 원격 백엔드)
VUE_APP_API_TARGET=http://localhost:8080
VUE_APP_WS_TARGET=ws://localhost:8080

# WebSocket URL
VUE_APP_WS_URL=ws://localhost:8080/ws
```

**동작 방식:**
```
프론트엔드 요청: GET /api/users
         ↓
   Vue DevServer Proxy
         ↓
백엔드 전송: GET http://localhost:8080/api/users
```

### 프로덕션 환경 (production.env)

```bash
# axios 클라이언트 baseURL (전체 URL)
VUE_APP_API_BASE_URL=https://api.kospot.com/api

# WebSocket URL
VUE_APP_WS_URL=wss://api.kospot.com/ws

# 프로덕션에서는 API_TARGET, WS_TARGET 불필요
# (devServer가 실행되지 않으므로)
```

**동작 방식:**
```
프론트엔드 요청: GET /api/users
         ↓
백엔드 전송: GET https://api.kospot.com/api/users
```

## 🚀 사용 방법

### 1. 환경변수 파일 생성

서브모듈 디렉토리에서 환경별 설정 파일을 생성합니다:

```bash
cd KoSpot-frontend-private

# development.env 파일 생성
cat > development.env << EOF
VUE_APP_API_BASE_URL=/api
VUE_APP_API_TARGET=http://localhost:8080
VUE_APP_WS_TARGET=ws://localhost:8080
VUE_APP_WS_URL=ws://localhost:8080/ws
EOF

# production.env 파일 생성
cat > production.env << EOF
VUE_APP_API_BASE_URL=https://api.kospot.com/api
VUE_APP_WS_URL=wss://api.kospot.com/ws
EOF
```

### 2. 환경변수 적용

```bash
# 개발 환경
npm run serve:dev

# 또는 수동 설정
node scripts/setup-env.js development setup
npm run serve
```

### 3. 빌드 및 배포

```bash
# 개발 환경 빌드
npm run build:dev

# 프로덕션 환경 빌드
npm run build:prod

# 프로덕션 배포 (Linux/Mac)
./scripts/deploy.sh production

# 프로덕션 배포 (Windows)
.\scripts\deploy.ps1 -Environment production
```

## 📝 주요 변경 사항

### 1. vue.config.js
- `VUE_APP_API_TARGET`: Proxy target을 환경변수로 관리
- `VUE_APP_WS_TARGET`: WebSocket target을 환경변수로 관리
- 로그 출력: 시작 시 API/WS target 확인 가능

### 2. apiClient.js
- `baseURL`: 개발환경은 `/api`, 프로덕션은 전체 URL
- 모든 API 요청에 자동으로 `/api` prefix 포함

### 3. 환경변수 템플릿 (config/env.template)
- 새로운 환경변수 추가 및 설명
- 개발/프로덕션 환경별 예시 제공

## 🔍 로컬 개발 시나리오

### 시나리오 1: 로컬 백엔드 연결
```bash
# development.env
VUE_APP_API_TARGET=http://localhost:8080
```

### 시나리오 2: 원격 개발 서버 연결
```bash
# development.env
VUE_APP_API_TARGET=https://dev.kospot.com
```

### 시나리오 3: 다른 포트의 백엔드 연결
```bash
# development.env
VUE_APP_API_TARGET=http://localhost:8888
```

## ⚠️ 주의사항

### 1. API Prefix 필수
모든 API 엔드포인트는 `/api`로 시작해야 합니다:

```javascript
✅ 올바른 예:
apiClient.get('/users')           // → GET /api/users
apiClient.post('/auth/login')     // → POST /api/auth/login

❌ 잘못된 예:
apiClient.get('users')            // → GET /apiusers (X)
axios.get('http://..../users')    // baseURL 우회 (X)
```

### 2. 환경 분리
- 개발환경: Proxy 사용 (`VUE_APP_API_TARGET` 필요)
- 프로덕션: 직접 연결 (`VUE_APP_API_BASE_URL`에 전체 URL)

### 3. CORS 설정
프로덕션에서는 백엔드의 CORS 설정이 필요합니다:

```java
// Spring Boot 예시
@Configuration
public class WebConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins("https://kospot.com")
                    .allowedMethods("GET", "POST", "PUT", "DELETE")
                    .allowCredentials(true);
            }
        };
    }
}
```

## 🛠 문제 해결

### API 요청이 실패하는 경우

1. **환경변수 확인:**
```bash
npm run env:show
```

2. **Proxy 설정 확인:**
```bash
# 개발 서버 시작 시 로그 확인
🔗 API Target: http://localhost:8080
🔗 WebSocket Target: ws://localhost:8080
```

3. **백엔드 서버 실행 확인:**
```bash
curl http://localhost:8080/api/health
```

4. **브라우저 콘솔 확인:**
- Network 탭에서 실제 요청 URL 확인
- 401/403: 인증 문제
- 404: 잘못된 엔드포인트
- 500: 백엔드 서버 오류
- CORS: CORS 설정 필요

### 배포 후 API 연결 실패

1. **환경변수 확인:**
```bash
# production.env 확인
cat KoSpot-frontend-private/production.env
```

2. **빌드된 환경변수 확인:**
```bash
# dist/js/app.*.js 파일에서 확인
grep -r "VUE_APP_API_BASE_URL" dist/
```

3. **백엔드 CORS 설정 확인**

4. **HTTPS 혼합 콘텐츠 확인:**
- HTTPS 사이트에서 HTTP API 호출 불가
- 백엔드도 HTTPS 필요

## 📚 관련 문서

- [환경변수 설정 가이드](./ENVIRONMENT_SETUP.md)
- [배포 가이드](./DEPLOY_SECRETS.md)
- [Vue.js 환경변수 문서](https://cli.vuejs.org/guide/mode-and-env.html)

