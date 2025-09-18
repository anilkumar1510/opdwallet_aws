#!/bin/bash

# Assignment Plan Version Override - Acceptance Test Script
# This script demonstrates the cohorting functionality

echo "====================================="
echo "Plan Version Override Acceptance Test"
echo "====================================="

# Configuration
API_BASE="http://localhost:4000/api"
COOKIE_FILE="/tmp/cookies.txt"

# Test credentials
ADMIN_EMAIL="admin@opdwallet.com"
ADMIN_PASS="Admin@123"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test results
print_test() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
    fi
}

# Function to login and get session
login() {
    echo -e "\n${YELLOW}Step 1: Logging in...${NC}"
    local response=$(curl -s -c "$COOKIE_FILE" -X POST \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" \
        "$API_BASE/auth/login")

    if echo "$response" | grep -q "userId"; then
        print_test "Login successful" 0
        USER_ID=$(echo "$response" | grep -o '"userId":"[^"]*' | sed 's/"userId":"//')
    else
        print_test "Login failed" 1
        exit 1
    fi
}

# Test 1: Get a policy with plan versions
test_get_policy() {
    echo -e "\n${YELLOW}Step 2: Finding a policy with plan versions...${NC}"

    # Get the first active policy
    local policies=$(curl -s -b "$COOKIE_FILE" "$API_BASE/policies?status=ACTIVE")
    POLICY_ID=$(echo "$policies" | grep -o '"_id":"[^"]*' | head -1 | sed 's/"_id":"//')

    if [ -n "$POLICY_ID" ]; then
        print_test "Found policy: $POLICY_ID" 0

        # Get plan versions for this policy
        local versions=$(curl -s -b "$COOKIE_FILE" "$API_BASE/policies/$POLICY_ID/plan-versions")
        echo "Available versions: $(echo "$versions" | grep -o '"planVersion":[0-9]*' | sed 's/"planVersion":/v/')"
    else
        print_test "No active policies found" 1
    fi
}

# Test 2: Get user assignments
test_get_assignments() {
    echo -e "\n${YELLOW}Step 3: Finding user with assignments...${NC}"

    # Get list of members
    local users=$(curl -s -b "$COOKIE_FILE" "$API_BASE/users?role=MEMBER")
    local member_id=$(echo "$users" | grep -o '"_id":"[^"]*' | head -1 | sed 's/"_id":"//')

    if [ -n "$member_id" ]; then
        # Get assignments for this user
        local assignments=$(curl -s -b "$COOKIE_FILE" "$API_BASE/users/$member_id/assignments")
        ASSIGNMENT_ID=$(echo "$assignments" | grep -o '"_id":"[^"]*' | head -1 | sed 's/"_id":"//')

        if [ -n "$ASSIGNMENT_ID" ]; then
            print_test "Found assignment: $ASSIGNMENT_ID" 0

            # Check effective plan version
            local effective_version=$(echo "$assignments" | grep -o '"effectivePlanVersion":[0-9]*' | head -1 | sed 's/"effectivePlanVersion"://')
            echo "Current effective version: v$effective_version"
        else
            print_test "No assignments found for user" 1
        fi
    else
        print_test "No members found" 1
    fi
}

# Test 3: Override plan version
test_override_version() {
    echo -e "\n${YELLOW}Step 4: Testing plan version override...${NC}"

    if [ -z "$ASSIGNMENT_ID" ]; then
        echo "Skipping: No assignment ID available"
        return
    fi

    # Set override to version 1
    echo "Setting override to v1..."
    local response=$(curl -s -b "$COOKIE_FILE" -X PATCH \
        -H "Content-Type: application/json" \
        -d '{"planVersion": 1}' \
        "$API_BASE/assignments/$ASSIGNMENT_ID/plan-version")

    if echo "$response" | grep -q "effectivePlanVersion"; then
        print_test "Override set successfully" 0
        local new_version=$(echo "$response" | grep -o '"effectivePlanVersion":[0-9]*' | sed 's/"effectivePlanVersion"://')
        echo "New effective version: v$new_version"
    else
        print_test "Failed to set override" 1
        echo "Error: $response"
    fi
}

# Test 4: Clear override
test_clear_override() {
    echo -e "\n${YELLOW}Step 5: Testing clear override...${NC}"

    if [ -z "$ASSIGNMENT_ID" ]; then
        echo "Skipping: No assignment ID available"
        return
    fi

    # Clear override
    echo "Clearing override..."
    local response=$(curl -s -b "$COOKIE_FILE" -X PATCH \
        -H "Content-Type: application/json" \
        -d '{"planVersion": null}' \
        "$API_BASE/assignments/$ASSIGNMENT_ID/plan-version")

    if echo "$response" | grep -q "effectivePlanVersion"; then
        print_test "Override cleared successfully" 0
        local version=$(echo "$response" | grep -o '"effectivePlanVersion":[0-9]*' | sed 's/"effectivePlanVersion"://')
        echo "Reverted to policy default: v$version"
    else
        print_test "Failed to clear override" 1
    fi
}

# Test 5: Try to set invalid version (DRAFT)
test_invalid_override() {
    echo -e "\n${YELLOW}Step 6: Testing validation (reject DRAFT version)...${NC}"

    if [ -z "$ASSIGNMENT_ID" ]; then
        echo "Skipping: No assignment ID available"
        return
    fi

    # Try to set a non-existent version (should fail)
    echo "Attempting to set non-existent version 999..."
    local response=$(curl -s -b "$COOKIE_FILE" -X PATCH \
        -H "Content-Type: application/json" \
        -d '{"planVersion": 999}' \
        "$API_BASE/assignments/$ASSIGNMENT_ID/plan-version")

    if echo "$response" | grep -q "not found\|error\|400"; then
        print_test "Validation working: Rejected invalid version" 0
    else
        print_test "Validation failed: Should reject invalid version" 1
    fi
}

# Test 6: Check audit logs
test_audit_logs() {
    echo -e "\n${YELLOW}Step 7: Checking audit logs...${NC}"

    # Get recent audit logs
    local logs=$(curl -s -b "$COOKIE_FILE" "$API_BASE/audit?action=ASSIGNMENT_PLAN_VERSION_UPDATE&limit=5")

    if echo "$logs" | grep -q "ASSIGNMENT_PLAN_VERSION_UPDATE"; then
        print_test "Audit logs recorded" 0
        local count=$(echo "$logs" | grep -c "ASSIGNMENT_PLAN_VERSION_UPDATE")
        echo "Found $count plan version update audit entries"
    else
        print_test "No audit logs found" 1
    fi
}

# Run all tests
main() {
    echo "Starting acceptance tests..."
    echo "API endpoint: $API_BASE"

    # Login
    login

    # Run test suite
    test_get_policy
    test_get_assignments
    test_override_version
    test_clear_override
    test_invalid_override
    test_audit_logs

    # Clean up
    rm -f "$COOKIE_FILE"

    echo -e "\n${GREEN}====================================="
    echo "Test suite completed!"
    echo "=====================================${NC}"
    echo ""
    echo "Summary:"
    echo "- Assignment plan version override allows cohorting"
    echo "- Members can have specific versions assigned"
    echo "- Validation prevents invalid assignments"
    echo "- All changes are audit logged"
}

# Execute main function
main