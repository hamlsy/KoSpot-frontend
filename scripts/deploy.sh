#!/bin/bash

# S3 배포 스크립트
# 환경별 배포를 위한 스크립트

set -e  # 에러 발생시 스크립트 종료

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수들
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 환경 설정
ENVIRONMENT=${1:-development}
VALID_ENVIRONMENTS=("development" "staging" "production")

# 환경 검증
if [[ ! " ${VALID_ENVIRONMENTS[@]} " =~ " ${ENVIRONMENT} " ]]; then
    log_error "Invalid environment: $ENVIRONMENT"
    log_info "Valid environments: ${VALID_ENVIRONMENTS[*]}"
    exit 1
fi

log_info "Starting deployment for environment: $ENVIRONMENT"

# AWS 설정 확인
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# AWS 자격 증명 확인
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# 환경변수 설정
log_info "Setting up environment variables..."
node scripts/setup-env.js $ENVIRONMENT setup

# 환경변수 검증
log_info "Validating environment configuration..."
if ! node scripts/setup-env.js $ENVIRONMENT validate; then
    log_error "Environment validation failed"
    exit 1
fi

# 빌드
log_info "Building application..."
case $ENVIRONMENT in
    "production")
        npm run build:prod
        ;;
    "staging")
        npm run build:staging
        ;;
    "development")
        npm run build:dev
        ;;
esac

# S3 버킷 설정 (환경별)
case $ENVIRONMENT in
    "production")
        S3_BUCKET=${S3_BUCKET_PROD:-"kospot-production-bucket"}
        CLOUDFRONT_ID=${CLOUDFRONT_ID_PROD:-""}
        ;;
    "staging")
        S3_BUCKET=${S3_BUCKET_STAGING:-"kospot-staging-bucket"}
        CLOUDFRONT_ID=${CLOUDFRONT_ID_STAGING:-""}
        ;;
    "development")
        S3_BUCKET=${S3_BUCKET_DEV:-"kospot-dev-bucket"}
        CLOUDFRONT_ID=${CLOUDFRONT_ID_DEV:-""}
        ;;
esac

log_info "S3 Bucket: $S3_BUCKET"

# S3 버킷 존재 확인
if ! aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
    log_error "S3 bucket '$S3_BUCKET' does not exist or is not accessible"
    exit 1
fi

# 배포 확인
read -p "Deploy to $ENVIRONMENT environment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Deployment cancelled"
    exit 0
fi

# S3에 파일 업로드
log_info "Uploading files to S3..."
aws s3 sync dist/ s3://$S3_BUCKET/ --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "*.html" \
    --exclude "*.json"

# HTML과 JSON 파일은 캐시하지 않음
log_info "Uploading HTML and JSON files..."
aws s3 cp dist/index.html s3://$S3_BUCKET/index.html \
    --cache-control "no-cache, no-store, must-revalidate"

# manifest.json 파일이 있으면 업로드
if [[ -f "dist/manifest.json" ]]; then
    aws s3 cp dist/manifest.json s3://$S3_BUCKET/manifest.json \
        --cache-control "no-cache, no-store, must-revalidate"
fi

# CloudFront 캐시 무효화
if [[ -n "$CLOUDFRONT_ID" ]]; then
    log_info "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"
    log_success "CloudFront cache invalidation initiated"
fi

log_success "Deployment completed successfully!"
log_info "Application deployed to: https://$S3_BUCKET.s3-website.$AWS_DEFAULT_REGION.amazonaws.com"

# 배포 정보 출력
log_info "Deployment Summary:"
echo "  Environment: $ENVIRONMENT"
echo "  S3 Bucket: $S3_BUCKET"
echo "  Build Time: $(date)"
echo "  Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
