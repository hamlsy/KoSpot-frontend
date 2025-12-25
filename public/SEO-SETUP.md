# KoSpot SEO 설정 가이드

## 📋 완료된 SEO 설정

### 1. ✅ 정적 HTML 웰컴 페이지
- 경로: `/welcome/index.html`
- 구글 크롤러가 완전히 읽을 수 있는 순수 HTML
- 모든 메타 태그 및 구조화된 데이터 포함

### 2. ✅ 핵심 키워드 최적화
다음 키워드로 최적화됨:
- 지리 게임
- 로드뷰
- 위치 맞추기
- 한국 여행 게임
- 한국 지리
- 관광지 게임
- 로드뷰 게임

**중요 원칙**: 
- ✅ geoguessr는 키워드 메타 태그에만 포함
- ❌ 제목, 설명, 본문에는 절대 사용 금지 (표절 의심 방지)
- ✅ 독자적인 설명: "로드뷰 기반 한국 관광지 위치 맞추기"

### 3. ✅ SEO 파일
- `sitemap.xml` - 검색 엔진에 페이지 구조 제공
- `robots.txt` - 크롤러 규칙 설정

### 4. ✅ 구조화된 데이터 (JSON-LD)
- Schema.org WebApplication 타입
- 앱 메타데이터, 평점, 키워드 포함

---

## 🎯 필수 작업: 이미지 설정

### 로고 이미지
웰컴 페이지 히어로 섹션 및 네비게이션 바에 표시되는 메인 로고

**현재 사용 중:**
- 파일명: `kospot_logo_1-removebg.png`
- 위치: `public/images/logo/kospot_logo_1-removebg.png`
- 형식: PNG (투명 배경)

**사용 위치:**
- 웰컴 페이지: 히어로 섹션 상단
- 전체 사이트: 네비게이션 바 좌측 상단
- 소셜 미디어: OG 이미지로도 활용

**디자인 가이드:**
- 브랜드 컬러 사용: #0ea5e9 (Primary Blue)
- 깔끔하고 읽기 쉬운 폰트
- 로드뷰/지도 관련 아이콘 포함 추천
- 모바일에서도 잘 보이도록 단순한 디자인

**배치 위치:**
- 웰컴 페이지: 히어로 섹션 좌측 상단 (배지 위)
- 최대 너비: 200px (모바일: 150px)

### OG (Open Graph) 이미지
소셜 미디어 공유 시 표시되는 이미지

**현재 사용 중:**
- 파일명: `kospot_logo_1-removebg.png` (로고와 동일)
- 위치: `public/images/logo/kospot_logo_1-removebg.png`
- 형식: PNG

**향후 개선 시:**
- 크기: **1200 x 630 픽셀** (권장)
- 형식: JPG 또는 PNG
- 용량: 300KB 이하 권장
- 내용: KoSpot 로고 + 게임 스크린샷 + "로드뷰로 떠나는 한국 여행" 텍스트
- ❌ "GeoGuessr" 텍스트 사용 금지

**생성 도구:**
- Canva: https://www.canva.com/
- Figma: https://www.figma.com/
- Photoshop 또는 기타 디자인 툴

### 파비콘 (Favicon)
브라우저 탭에 표시되는 작은 아이콘

**현재 사용 중:**
- 파일명: `kospot_icon_1-removebg.png`
- 위치: `public/images/icon/kospot_icon_1-removebg.png`
- 형식: PNG

**향후 개선 시 권장:**
다양한 크기의 파비콘 생성:
```
public/
├── favicon.ico          (32x32, 다중 크기)
├── favicon-16x16.png    (16x16)
├── favicon-32x32.png    (32x32)
└── apple-touch-icon.png (180x180)
```

**생성 도구:**
- Favicon Generator: https://realfavicongenerator.net/
- Favicon.io: https://favicon.io/

---

## 🚀 Google Search Console 등록

### 1. 사이트 소유권 확인
1. [Google Search Console](https://search.google.com/search-console) 접속
2. 도메인 추가
3. HTML 태그 방식으로 소유권 확인 (이미 준비됨)
4. 또는 HTML 파일 업로드 방식

### 2. Sitemap 제출
```
https://kospot.com/sitemap.xml
```
위 URL을 Google Search Console에서 제출

### 3. URL 색인 요청
웰컴 페이지 URL 직접 제출:
```
https://kospot.com/welcome/
```

---

## 📊 SEO 성능 측정

### 필수 도구
1. **Google PageSpeed Insights**
   - https://pagespeed.web.dev/
   - 웰컴 페이지 성능 및 SEO 점수 확인

2. **Google Search Console**
   - 검색 노출 및 클릭 데이터 확인
   - 색인 상태 모니터링

3. **Rich Results Test**
   - https://search.google.com/test/rich-results
   - 구조화된 데이터 유효성 검사

### 권장 도구
- **Ahrefs** - 키워드 순위 추적
- **SEMrush** - 경쟁사 분석
- **Google Analytics** - 트래픽 분석

---

## 🔧 추가 최적화 (선택사항)

### 1. 서버 설정
**Vite 빌드 시 리다이렉트 설정**

`vercel.json` (Vercel 사용 시):
```json
{
  "redirects": [
    {
      "source": "/",
      "destination": "/welcome/",
      "permanent": false
    }
  ]
}
```

`netlify.toml` (Netlify 사용 시):
```toml
[[redirects]]
  from = "/"
  to = "/welcome/"
  status = 302
```

### 2. 메타 태그 동적 업데이트
프로덕션 배포 전 `public/welcome/index.html`에서 업데이트:
- 실제 도메인 URL
- Twitter 계정 핸들
- 실제 OG 이미지 경로

### 3. 성능 최적화
- [ ] 이미지 WebP 형식으로 변환
- [ ] Font Awesome 아이콘 최소화 (사용하는 아이콘만)
- [ ] CSS minify
- [ ] HTML minify

---

## ✅ 체크리스트

배포 전 확인:

### 이미지 및 아이콘
- [x] 로고 이미지 적용 (`public/images/logo/kospot_logo_1-removebg.png`)
- [x] 파비콘 적용 (`public/images/icon/kospot_icon_1-removebg.png`)
- [x] OG 이미지 임시 적용 (로고 이미지로 대체)
- [ ] 전용 OG 이미지 생성 (1200x630, 로고 + 게임 스크린샷 + 텍스트)
- [ ] 다양한 크기의 파비콘 생성 (최적화)

### SEO 설정
- [ ] `welcome/index.html`에서 URL을 실제 도메인으로 수정
- [ ] Google Search Console 등록
- [ ] Sitemap 제출
- [ ] PageSpeed Insights 점수 확인 (90+ 목표)
- [ ] Mobile-Friendly Test 통과
- [ ] Rich Results Test 통과

### 광고 설정
- [ ] Google AdSense 계정 생성
- [ ] AdSense 코드를 `#google-ad-welcome` 영역에 삽입
- [ ] 광고 표시 확인 및 테스트

---

## 📝 주요 URL

- **웰컴 페이지**: https://kospot.com/welcome/
- **메인 앱**: https://kospot.com/main
- **Sitemap**: https://kospot.com/sitemap.xml
- **Robots.txt**: https://kospot.com/robots.txt

---

## 💡 팁

1. **정기적인 콘텐츠 업데이트**
   - 통계 수치 (플레이어 수, 게임 플레이 수) 정기 업데이트
   - lastmod 날짜 갱신

2. **백링크 구축**
   - 관련 커뮤니티에 게임 소개
   - 블로그 포스트 작성
   - 소셜 미디어 공유

3. **키워드 모니터링**
   - "한국 지리 게임"
   - "로드뷰 게임"
   - "위치 맞추기 게임"
   등의 키워드 순위 추적

4. **로딩 속도**
   - 웰컴 페이지 로딩 시간 2초 이내 목표
   - CDN 사용 고려
   - 이미지 최적화: 게임 스크린샷 WebP 변환 검토

5. **광고 수익화**
   - Google AdSense 승인 후 광고 활성화
   - 광고 위치: 히어로 섹션과 게임 정보 섹션 사이
   - 반응형 광고 단위 사용 (데스크탑: 728x90, 모바일: 320x100)
   - 사용자 경험을 해치지 않는 선에서 배치

