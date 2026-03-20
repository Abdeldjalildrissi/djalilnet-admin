#!/bin/bash
# DEPLOYMENT SCRIPT FOR DJALILNET-ADMIN

set -e

# Load from our prepared production file
source .env.production

# Function to add/update env on Vercel
set_vercel_env() {
  local key=$1
  local value=$2
  echo "Updating $key on Vercel (Production)..."
  # Support both adding and updating by removing first
  npx vercel env rm "$key" production --yes || true
  echo "$value" | npx vercel env add "$key" production --yes
}

set_vercel_env "DATABASE_URL" "$DATABASE_URL"
set_vercel_env "BETTER_AUTH_SECRET" "$BETTER_AUTH_SECRET"
set_vercel_env "BETTER_AUTH_URL" "$BETTER_AUTH_URL"
set_vercel_env "NEXT_PUBLIC_ADMIN_URL" "$NEXT_PUBLIC_ADMIN_URL"
set_vercel_env "NEXT_PUBLIC_SITE_URL" "$NEXT_PUBLIC_SITE_URL"
set_vercel_env "RESEND_API_KEY" "$RESEND_API_KEY"
set_vercel_env "RESEND_FROM_EMAIL" "$RESEND_FROM_EMAIL"
set_vercel_env "RESEND_WEBHOOK_SECRET" "$RESEND_WEBHOOK_SECRET"
set_vercel_env "ADMIN_EMAIL" "$ADMIN_EMAIL"
set_vercel_env "UPLOADTHING_TOKEN" "$UPLOADTHING_TOKEN"
set_vercel_env "UPLOADTHING_SECRET" "$UPLOADTHING_SECRET"
set_vercel_env "UPLOADTHING_APP_ID" "$UPLOADTHING_APP_ID"
set_vercel_env "UPSTASH_REDIS_REST_URL" "$UPSTASH_REDIS_REST_URL"
set_vercel_env "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN"
set_vercel_env "UPSTASH_REDIS_URL" "$UPSTASH_REDIS_URL"

# Deploy to production
echo "🚀 Triggering Production Deployment..."
npx vercel --prod --yes
