#!/usr/bin/env bash
# ==============================================================================
# Advisory Cloud Run A2A Service Deployment Script
# Part of GeminiPostCutoff Architecture Review Engine
# ==============================================================================
set -euo pipefail

PROJECT_ID="${1:-$(gcloud config get-value project 2>/dev/null || echo "")}"
REGION="${2:-us-central1}"
SERVICE_NAME="architecture-reviewer-a2a"
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/geminipostcutoff/${SERVICE_NAME}:latest"

if [ -z "$PROJECT_ID" ]; then
  echo "Error: PROJECT_ID not provided and not set in gcloud config."
  echo "Usage: ./deploy.sh <PROJECT_ID> [REGION]"
  exit 1
fi

echo "=============================================================================="
echo "ADVISORY CLOUD RUN A2A MICROSERVICE DEPLOYMENT"
echo "=============================================================================="
echo "Project:   ${PROJECT_ID}"
echo "Region:    ${REGION}"
echo "Service:   ${SERVICE_NAME}"
echo "Image:     ${IMAGE_URI}"
echo ""

echo "Step 1: Enabling Required GCP APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project="${PROJECT_ID}"

echo "Step 2: Ensuring Artifact Registry Repository exists..."
gcloud artifacts repositories create geminipostcutoff \
  --repository-format=docker \
  --location="${REGION}" \
  --description="GeminiPostCutoff Architecture Reviewer Images" \
  --project="${PROJECT_ID}" 2>/dev/null || true

echo "Step 3: Building Container Image with Cloud Build..."
gcloud builds submit . \
  --config=review_engine/server/cloudbuild.yaml \
  --substitutions=_IMAGE_URI="${IMAGE_URI}" \
  --project="${PROJECT_ID}"

echo "Step 4: Deploying Cloud Run Service with Direct VPC Egress & Non-Throttled CPU..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_URI}" \
  --region="${REGION}" \
  --platform=managed \
  --no-allow-unauthenticated \
  --no-cpu-throttling \
  --min-instances=0 \
  --max-instances=10 \
  --cpu=2 \
  --memory=2Gi \
  --set-env-vars="NODE_ENV=production,MODEL_CALIBRATION=flash-3.8" \
  --project="${PROJECT_ID}"

echo "Step 5: Granting Invoker Role to Authorized Teammates / CI Service Accounts..."
echo "To grant invoker permission, run:"
echo "  gcloud run services add-iam-policy-binding ${SERVICE_NAME} \\"
echo "    --region=${REGION} \\"
echo "    --member='group:developers@yourdomain.com' \\"
echo "    --role='roles/run.invoker' \\"
echo "    --project=${PROJECT_ID}"
echo ""
echo "[SUCCESS] Cloud Run A2A Architecture Reviewer Service Ready!"
