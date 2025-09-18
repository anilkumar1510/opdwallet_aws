#!/bin/bash

# Policy with past date
POLICY_ID="68cac97bcfcf6640448a23fe"

echo "Testing with Policy POL-2025-0005 (effective from 2024)"
echo "Policy ID: $POLICY_ID"

# Create a new draft version with current dates
echo -e "\n=== Creating Draft Version ==="
curl -X POST "http://localhost:4000/api/admin/policies/$POLICY_ID/plan-versions" \
  -H "Content-Type: application/json" \
  -d '{
    "effectiveFrom": "2024-01-01T00:00:00.000Z",
    "effectiveTo": "2024-12-31T00:00:00.000Z"
  }' \
  -b /tmp/cookies.txt -s | jq '{version: .planVersion, status: .status}'

# Get the version number
VERSION=$(curl -X GET "http://localhost:4000/api/admin/policies/$POLICY_ID/plan-versions" \
  -b /tmp/cookies.txt -s | jq -r '.data[0].planVersion')

echo -e "\n=== Publishing Version $VERSION ==="
curl -X POST "http://localhost:4000/api/admin/policies/$POLICY_ID/plan-versions/$VERSION/publish" \
  -b /tmp/cookies.txt -s | jq '{version: .planVersion, status: .status, publishedAt: .publishedAt}'

echo -e "\n=== Making Version $VERSION Current ==="
RESULT=$(curl -X PATCH "http://localhost:4000/api/policies/$POLICY_ID/current-plan-version" \
  -H "Content-Type: application/json" \
  -d "{\"planVersion\": $VERSION}" \
  -b /tmp/cookies.txt -s)

echo "$RESULT" | jq '{policyNumber: .policyNumber, currentPlanVersion: .currentPlanVersion}' 2>/dev/null || echo "$RESULT" | jq

echo -e "\n=== Final Policy State ==="
curl -X GET "http://localhost:4000/api/policies/$POLICY_ID" \
  -b /tmp/cookies.txt -s | jq '{policyNumber: .policyNumber, currentPlanVersion: .currentPlanVersion}'