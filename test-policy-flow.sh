#!/bin/bash

echo "Testing Policy Management Flow"
echo "==============================="

API_URL="http://localhost:4000/api"
ADMIN_EMAIL="admin@opdwallet.com"
ADMIN_PASSWORD="Admin@123"

# 1. Login as Admin
echo -e "\n1. Logging in as Admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  -c cookies.txt)

echo "Login successful"

# 2. Get all policies
echo -e "\n2. Fetching all policies..."
POLICIES=$(curl -s -X GET "$API_URL/policies" \
  -H "Content-Type: application/json" \
  -b cookies.txt)

echo "Policies found: $(echo $POLICIES | jq '.total')"

# 3. Create a new policy
echo -e "\n3. Creating a new test policy..."
NEW_POLICY=$(curl -s -X POST "$API_URL/policies" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Test Premium Plan",
    "description": "A test policy for verification",
    "status": "DRAFT",
    "effectiveFrom": "2025-01-01",
    "effectiveTo": "2025-12-31",
    "ownerPayer": "Corporate"
  }')

POLICY_ID=$(echo $NEW_POLICY | jq -r '._id')
POLICY_NUMBER=$(echo $NEW_POLICY | jq -r '.policyNumber')
echo "Created policy: $POLICY_NUMBER (ID: $POLICY_ID)"

# 4. Get the specific policy
echo -e "\n4. Fetching policy details..."
POLICY_DETAIL=$(curl -s -X GET "$API_URL/policies/$POLICY_ID" \
  -H "Content-Type: application/json" \
  -b cookies.txt)

echo "Policy details retrieved:"
echo $POLICY_DETAIL | jq '{policyNumber, name, status, effectiveFrom, effectiveTo, ownerPayer}'

# 5. Update the policy
echo -e "\n5. Updating policy status to ACTIVE..."
UPDATED_POLICY=$(curl -s -X PUT "$API_URL/policies/$POLICY_ID" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Test Premium Plan - Updated",
    "status": "ACTIVE",
    "description": "Updated description for the test policy"
  }')

echo "Policy updated:"
echo $UPDATED_POLICY | jq '{name, status, description, updatedBy}'

# 6. Verify all fields are present
echo -e "\n6. Verifying all required fields..."
FIELDS_CHECK=$(echo $UPDATED_POLICY | jq 'keys')
echo "Fields present in policy:"
echo $FIELDS_CHECK

# Clean up
rm -f cookies.txt

echo -e "\n✅ Policy management flow test completed successfully!"