# S3 배포 PowerShell 스크립트
# Windows 환경에서 사용할 수 있는 배포 스크립트

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment = "development"
)

# 색상 정의
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
    White = "White"
}

# 로그 함수들
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor $Colors.Red
}

# 환경 설정
Write-Info "Starting deployment for environment: $Environment"

# AWS CLI 확인
try {
    $awsVersion = aws --version 2>$null
    if (-not $awsVersion) {
        throw "AWS CLI not found"
    }
    Write-Info "AWS CLI found: $awsVersion"
} catch {
    Write-Error "AWS CLI is not installed or not in PATH. Please install it first."
    exit 1
}

# AWS 자격 증명 확인
try {
    $callerIdentity = aws sts get-caller-identity 2>$null
    if (-not $callerIdentity) {
        throw "AWS credentials not configured"
    }
    Write-Success "AWS credentials verified"
} catch {
    Write-Error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
}

# 환경변수 설정
Write-Info "Setting up environment variables..."
& node scripts/setup-env.js $Environment setup

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to setup environment variables"
    exit 1
}

# 환경변수 검증
Write-Info "Validating environment configuration..."
& node scripts/setup-env.js $Environment validate

if ($LASTEXITCODE -ne 0) {
    Write-Error "Environment validation failed"
    exit 1
}

# 빌드 전 dist 폴더 완전 삭제 (캐시 무효화 보장)
Write-Info "Cleaning dist folder..."
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
    Write-Success "Dist folder cleaned"
} else {
    Write-Info "Dist folder does not exist, skipping cleanup"
}

# 빌드
Write-Info "Building application..."
switch ($Environment) {
    "production" {
        npm run build:prod
    }
    "staging" {
        npm run build:staging
    }
    "development" {
        npm run build:dev
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed"
    exit 1
}

# S3 버킷 설정 (환경별)
$S3Bucket = switch ($Environment) {
    "production" { $env:S3_BUCKET_PROD ?? "kospot-production-bucket" }
    "staging" { $env:S3_BUCKET_STAGING ?? "kospot-staging-bucket" }
    "development" { $env:S3_BUCKET_DEV ?? "kospot-dev-bucket" }
}

$CloudFrontId = switch ($Environment) {
    "production" { $env:CLOUDFRONT_ID_PROD ?? "" }
    "staging" { $env:CLOUDFRONT_ID_STAGING ?? "" }
    "development" { $env:CLOUDFRONT_ID_DEV ?? "" }
}

Write-Info "S3 Bucket: $S3Bucket"

# S3 버킷 존재 확인
try {
    aws s3 ls "s3://$S3Bucket" 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Bucket not accessible"
    }
    Write-Success "S3 bucket verified"
} catch {
    Write-Error "S3 bucket '$S3Bucket' does not exist or is not accessible"
    exit 1
}

# 배포 확인
$confirmation = Read-Host "Deploy to $Environment environment? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Warning "Deployment cancelled"
    exit 0
}

# S3에 파일 업로드
Write-Info "Uploading files to S3..."

# 정적 파일들 업로드 (캐시 설정)
aws s3 sync dist/ "s3://$S3Bucket/" --delete `
    --cache-control "public, max-age=31536000" `
    --exclude "*.html" `
    --exclude "*.json"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to upload static files"
    exit 1
}

# HTML과 JSON 파일은 캐시하지 않음
Write-Info "Uploading HTML and JSON files..."
aws s3 cp dist/index.html "s3://$S3Bucket/index.html" `
    --cache-control "no-cache, no-store, must-revalidate"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to upload index.html"
    exit 1
}

# manifest.json 파일이 있으면 업로드
if (Test-Path "dist/manifest.json") {
    aws s3 cp dist/manifest.json "s3://$S3Bucket/manifest.json" `
        --cache-control "no-cache, no-store, must-revalidate"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to upload manifest.json"
    }
}

# CloudFront 캐시 무효화 및 완료 대기
if ($CloudFrontId) {
    Write-Info "Invalidating CloudFront cache..."
    
    # 무효화 요청 생성
    $invalidationOutput = aws cloudfront create-invalidation --distribution-id $CloudFrontId --paths "/*" | ConvertFrom-Json
    
    if ($LASTEXITCODE -eq 0 -and $invalidationOutput) {
        $invalidationId = $invalidationOutput.Invalidation.Id
        Write-Success "CloudFront cache invalidation initiated: $invalidationId"
        
        # 무효화 완료까지 대기 (최대 15분)
        Write-Info "Waiting for invalidation to complete (this may take up to 15 minutes)..."
        $maxWaitTime = 900  # 15분 (초)
        $waitInterval = 10  # 10초마다 확인
        $elapsedTime = 0
        
        while ($elapsedTime -lt $maxWaitTime) {
            Start-Sleep -Seconds $waitInterval
            $elapsedTime += $waitInterval
            
            $statusOutput = aws cloudfront get-invalidation --distribution-id $CloudFrontId --id $invalidationId | ConvertFrom-Json
            
            if ($statusOutput -and $statusOutput.Invalidation) {
                $status = $statusOutput.Invalidation.Status
                
                if ($status -eq "Completed") {
                    Write-Success "CloudFront cache invalidation completed!"
                    break
                } elseif ($status -eq "InProgress") {
                    $progress = [math]::Round(($elapsedTime / $maxWaitTime) * 100, 1)
                    Write-Info "Invalidation in progress... ($progress% of max wait time elapsed)"
                }
            }
        }
        
        if ($elapsedTime -ge $maxWaitTime) {
            Write-Warning "Invalidation is still in progress after maximum wait time. It will continue in the background."
        }
    } else {
        Write-Warning "Failed to invalidate CloudFront cache"
    }
}

Write-Success "Deployment completed successfully!"

# 배포 정보 출력
$region = $env:AWS_DEFAULT_REGION ?? "ap-northeast-2"
$gitCommit = try { git rev-parse --short HEAD 2>$null } catch { "N/A" }

Write-Info "Deployment Summary:"
Write-Host "  Environment: $Environment" -ForegroundColor $Colors.White
Write-Host "  S3 Bucket: $S3Bucket" -ForegroundColor $Colors.White
Write-Host "  Build Time: $(Get-Date)" -ForegroundColor $Colors.White
Write-Host "  Git Commit: $gitCommit" -ForegroundColor $Colors.White
Write-Host "  Application URL: https://$S3Bucket.s3-website.$region.amazonaws.com" -ForegroundColor $Colors.Cyan
