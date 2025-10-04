# Deploy.yml GitHub Secrets 리스트

## deploy.yml에서 사용되는 Secrets

### 필수 Secrets (3개)

#### 1. AWS_ACCESS_KEY_ID
- **위치:** Line 92
- **용도:** AWS 자격 증명 설정
- **설명:** AWS 액세스 키 ID (20자리 영문+숫자)

#### 2. AWS_SECRET_ACCESS_KEY
- **위치:** Line 93
- **용도:** AWS 자격 증명 설정
- **설명:** AWS 시크릿 액세스 키 (40자리 영문+숫자+특수문자)

#### 3. S3_BUCKET
- **위치:** Line 107
- **용도:** S3 배포 대상 버킷
- **설명:** S3 버킷 이름 (전 세계적으로 고유해야 함)

### 자동 제공 Secrets (1개)

#### 4. GITHUB_TOKEN
- **위치:** Line 25, 81
- **용도:** Submodule 접근용
- **설명:** GitHub에서 자동 제공 (설정 불필요)

## 설정해야 할 Secrets 값

```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET=kospot-bucket
```

## 설정 방법

1. GitHub Repository → Settings → Secrets and variables → Actions
2. New repository secret 클릭
3. Secret name과 Value 입력
4. Add secret 클릭

## AWS 키 생성 방법

1. AWS Console → IAM → Users → [사용자명] → Security credentials
2. Create access key → Command Line Interface (CLI)
3. Access key ID와 Secret access key 복사

## S3 버킷 생성 방법

```bash
# 버킷 생성
aws s3 mb s3://kospot-bucket --region ap-northeast-2

# 정적 웹사이트 호스팅 활성화
aws s3 website s3://kospot-bucket --index-document index.html
```
