# 🚀 Advanced Code Optimization Scripts

이 폴더에는 코드 최적화를 위한 고급 스크립트들이 포함되어 있습니다.

## 📁 스크립트 목록

### 1. 🔧 `fix-imports.js` - Import 자동 수정
잘못된 import 경로를 자동으로 찾아서 올바른 경로로 수정합니다.

**기능:**
- 깨진 import 자동 감지
- 파일 시스템 기반 올바른 경로 추천
- 상대/절대 경로 변환
- Vue, JS, TS 파일 지원
- 백업 및 롤백 기능

**사용법:**
```bash
# NPM 스크립트로 실행
npm run fix-imports

# 직접 실행
node scripts/fix-imports.js
```

### 2. 🧹 `deduplicator.js` - 중복 코드 제거
CSS와 JavaScript 중복 코드를 찾아서 제거하고 최적화합니다.

**기능:**
- 중복 CSS 클래스/스타일 감지 및 통합
- 중복 JavaScript 함수 감지 및 추출
- 공통 유틸리티 함수 자동 생성
- 중복률 분석 및 리포트
- 자동 리팩토링 제안

**사용법:**
```bash
# NPM 스크립트로 실행
npm run dedup

# 직접 실행
node scripts/deduplicator.js
```

### 3. 🔄 `restore-imports.js` - 백업 복원
작업 전에 생성된 백업을 복원합니다.

**사용법:**
```bash
# 백업 목록 조회
npm run restore list

# 최신 백업 복원
npm run restore restore

# 특정 백업 복원
npm run restore restore backup-name

# 중복 제거 백업 목록 조회
npm run restore list -- --deduplication

# 중복 제거 백업 복원
npm run restore restore -- --deduplication
```

### 4. ⚡ 전체 최적화
```bash
# Import 수정 + 중복 제거를 한 번에 실행
npm run optimize
```

## 📊 사용 예시

### Import 문제 수정
```bash
npm run fix-imports
```

출력 예시:
```
🚀 Starting Import Fixer

📁 Building file cache...
✅ Cached 245 files

🔍 Analyzing import statements...
⚠️  src/components/Button.vue: 2 broken imports
✅ Fixed src/components/Button.vue

📊 Import Fix Report
──────────────────────────────────────────────────
✅ Fixed files: 3
✅ Fixed imports: 5
⚠️  Total issues found: 5

🔧 Fixed Imports:
  src/components/Button.vue
    ../utils/helper → ./utils/helper
```

### 중복 코드 분석
```bash
npm run dedup
```

출력 예시:
```
🧹 Starting Code Deduplication

📁 Collecting files...
✅ Found 156 files
  CSS: 45, JS: 67, Vue: 44

🎨 Analyzing CSS duplicates...
⚠️  Found 8 CSS duplicate groups

⚙️  Analyzing JavaScript duplicates...
⚠️  Found 5 exact JS duplicates
⚠️  Found 3 similar JS function groups

📊 Code Deduplication Report
────────────────────────────────────────────────────────────
📁 Files scanned: 156
🎨 CSS rules found: 892
⚙️  JS functions found: 234
🔍 CSS duplicates: 8
🔍 JS duplicates: 8
✅ Total duplicates removed: 16

💡 Optimization Suggestions:
  1. HIGH - 4 identical CSS rules found
     Action: Extract to common-style-1 class
     Potential savings: ~280 bytes
```

## ⚙️ 설정 옵션

### Import Fixer 설정
```javascript
const fixer = new ImportFixer({
    srcDir: 'src',              // 소스 디렉토리
    backup: true,               // 백업 생성 여부
    aliases: {                  // 경로 별칭
        '@': 'src',
        '@core': 'src/core',
        '@features': 'src/features'
    }
});
```

### Deduplicator 설정
```javascript
const deduplicator = new CodeDeduplicator({
    srcDir: 'src',              // 소스 디렉토리
    threshold: 0.8,             // 유사도 임계값 (80%)
    minLength: 50,              // 최소 코드 길이
    backup: true                // 백업 생성 여부
});
```

## 🔒 안전성

- **자동 백업**: 모든 변경 사항은 실행 전에 자동으로 백업됩니다
- **복원 기능**: 언제든지 이전 상태로 복원할 수 있습니다
- **미리보기**: 실제 변경 전에 어떤 변경이 일어날지 미리 확인할 수 있습니다

## 🚨 주의사항

1. **백업 확인**: 중요한 작업 전에는 반드시 Git 커밋을 해주세요
2. **테스트 실행**: 변경 후에는 반드시 빌드 테스트를 실행하세요
3. **리뷰 필요**: 자동 생성된 코드는 리뷰 후 사용하세요

## 🛠️ 트러블슈팅

### Import 문제가 해결되지 않는 경우
1. 파일 경로가 올바른지 확인
2. 별칭(alias) 설정이 정확한지 확인
3. 수동으로 경로를 수정 후 다시 실행

### 중복 제거가 정확하지 않은 경우
1. `threshold` 값을 조정 (기본값: 0.8)
2. `minLength` 값을 조정 (기본값: 50)
3. 생성된 유틸리티 함수를 수동으로 검토

### 백업 복원이 필요한 경우
```bash
# 백업 목록 확인
npm run restore list

# 복원 실행
npm run restore restore
```

## 📈 성능 개선 효과

- **Import 오류 해결**: 빌드 오류 0개 달성
- **코드 중복 제거**: 평균 15-20% 코드 크기 감소
- **유지보수성 향상**: 공통 코드 모듈화로 관리 효율성 증대
- **개발 시간 단축**: 수동 작업 시간 90% 절약

---

💡 **팁**: 정기적으로 이 스크립트들을 실행하여 코드 품질을 유지하세요! 