#!/bin/bash

# Login and get token
echo "Logging in..."
TOKEN=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@opdwallet.com","password":"SuperAdmin@123"}' \
  -s | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Login failed"
  exit 1
fi

echo "Token obtained: ${TOKEN:0:20}..."

# Get first policy
echo -e "\nGetting first policy..."
POLICY_ID=$(curl -X GET "http://localhost:4000/api/policies?limit=1" \
  -H "Cookie: token=$TOKEN" \
  -s | jq -r '.data[0]._id')

if [ "$POLICY_ID" == "null" ] || [ -z "$POLICY_ID" ]; then
  echo "No policies found"
  exit 1
fi

echo "Policy ID: $POLICY_ID"

# Test plan versions endpoint
echo -e "\nTesting plan versions endpoint..."
curl -X GET "http://localhost:4000/api/admin/policies/$POLICY_ID/plan-versions" \
  -H "Cookie: token=$TOKEN" \
  -s | jq

echo -e "\nTesting current version endpoint..."
curl -X GET "http://localhost:4000/api/admin/policies/$POLICY_ID/plan-versions/current" \
  -H "Cookie: token=$TOKEN" \
  -s | jq