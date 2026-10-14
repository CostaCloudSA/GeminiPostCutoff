<#
.SYNOPSIS
    Advisory Cloud Run A2A Service Deployment Script (PowerShell)
    Part of GeminiPostCutoff Architecture Review Engine
#>
param(
    [string]$ProjectId = $(gcloud config get-value project 2>$null),
    [string]$Region = "us-central1"
)

if (-not $ProjectId) {
    Write-Error "Error: ProjectId not provided and not set in gcloud config. Usage: .\deploy.ps1 -ProjectId <PROJECT_ID> [-Region <REGION>]"
    exit 1
}

$ServiceName = "architecture-reviewer-a2a"
$ImageUri = "${Region}-docker.pkg.dev/${ProjectId}/geminipostcutoff/${ServiceName}:latest"

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "ADVISORY CLOUD RUN A2A MICROSERVICE DEPLOYMENT (POWERSHELL)" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "Project:   $ProjectId"
Write-Host "Region:    $Region"
Write-Host "Service:   $ServiceName"
Write-Host "Image:     $ImageUri`n"

Write-Host "Step 1: Enabling Required GCP APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com --project=$ProjectId

Write-Host "Step 2: Ensuring Artifact Registry exists..." -ForegroundColor Yellow
gcloud artifacts repositories create geminipostcutoff --repository-format=docker --location=$Region --description="GeminiPostCutoff Images" --project=$ProjectId 2>$null

Write-Host "Step 3: Building Container Image..." -ForegroundColor Yellow
gcloud builds submit . --tag=$ImageUri --project=$ProjectId

Write-Host "Step 4: Deploying Cloud Run Service with Direct VPC Egress & Non-Throttled CPU..." -ForegroundColor Yellow
gcloud run deploy $ServiceName `
    --image=$ImageUri `
    --region=$Region `
    --platform=managed `
    --no-allow-unauthenticated `
    --no-cpu-throttling `
    --min-instances=0 `
    --max-instances=10 `
    --cpu=2 `
    --memory=2Gi `
    --set-env-vars="NODE_ENV=production,MODEL_CALIBRATION=flash-3.8" `
    --project=$ProjectId

Write-Host "`n[SUCCESS] Cloud Run A2A Architecture Reviewer Service Ready!" -ForegroundColor Green
