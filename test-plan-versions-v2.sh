#!/bin/bash

# Login and get token/cookie
echo "Logging in..."
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@opdwallet.com","password":"Admin@123"}' \
  -c /tmp/cookies.txt -s > /dev/null

echo "Login successful"

# Get first policy ID
echo -e "\nGetting first policy..."
POLICY_ID=$(curl -X GET "http://localhost:4000/api/policies?limit=1" \
  -b /tmp/cookies.txt \
  -s | jq -r '.data[0]._id')

echo "Policy ID: $POLICY_ID"

# List current versions
echo -e "\n=== Current Plan Versions ==="
curl -X GET "http://localhost:4000/api/admin/policies/$POLICY_ID/plan-versions" \
  -b /tmp/cookies.txt -s | jq '.data[] | {version: .planVersion, status: .status, effectiveFrom: .effectiveFrom}'

# Create a new draft version
echo -e "\n=== Creating Draft Version 2 ==="
curl -X POST "http://localhost:4000/api/admin/policies/$POLICY_ID/plan-versions" \
  -H "Content-Type: application/json" \
  -d '{
    "effectiveFrom": "2025-06-01T00:00:00.000Z",
    "effectiveTo": "2025-12-31T00:00:00.000Z"
  }' \
  -b /tmp/cookies.txt -s | jq '{version: .planVersion, status: .status, id: ._id}'

# List versions again
echo -e "\n=== After Creating Draft ==="
curl -X GET "http://localhost:4000/api/admin/policies/$POLICY_ID/plan-versions" \
  -b /tmp/cookies.txt -s | jq '.data[] | {version: .planVersion, status: .status}'

# Publish version 2
echo -e "\n=== Publishing Version 2 ==="
curl -X POST "http://localhost:4000/api/admin/policies/$POLICY_ID/plan-versions/2/publish" \
  -b /tmp/cookies.txt -s | jq '{version: .planVersion, status: .status, publishedAt: .publishedAt}'

# Make version 2 current
echo -e "\n=== Making Version 2 Current ==="
curl -X PATCH "http://localhost:4000/api/policies/$POLICY_ID/current-plan-version" \
  -H "Content-Type: application/json" \
  -d '{"planVersion": 2}' \
  -b /tmp/cookies.txt -s | jq '{policyNumber: .policyNumber, currentPlanVersion: .currentPlanVersion}'

# Final state
echo -e "\n=== Final State ==="
curl -X GET "http://localhost:4000/api/admin/policies/$POLICY_ID/plan-versions" \
  -b /tmp/cookies.txt -s | jq '.data[] | {version: .planVersion, status: .status, isCurrent: (.planVersion == 2)}'