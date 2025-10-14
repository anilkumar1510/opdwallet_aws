#!/bin/bash

echo "========================================="
echo "Location Endpoints Diagnostic Test"
echo "========================================="
echo ""

# First, test if API is reachable
echo "1. Testing API health..."
curl -s http://localhost:4000/api/health | jq . || echo "Health check failed"
echo ""

# Test autocomplete endpoint (no auth - should get 401)
echo "2. Testing autocomplete endpoint (no auth - expect 401)..."
response=$(curl -s -w "\n%{http_code}" http://localhost:4000/api/location/autocomplete?query=Bangalore)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "HTTP Code: $http_code"
echo "Response: $body"
echo ""

# Test reverse-geocode endpoint (no auth - should get 401)
echo "3. Testing reverse-geocode endpoint (no auth - expect 401)..."
response=$(curl -s -w "\n%{http_code}" http://localhost:4000/api/location/reverse-geocode?lat=12.9716&lng=77.5946)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "HTTP Code: $http_code"
echo "Response: $body"
echo ""

# Test geocode endpoint (no auth - should get 401)
echo "4. Testing geocode endpoint (no auth - expect 401)..."
response=$(curl -s -w "\n%{http_code}" "http://localhost:4000/api/location/geocode?query=Bangalore")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "HTTP Code: $http_code"
echo "Response: $body"
echo ""

echo "========================================="
echo "Now let's get a token and test with auth"
echo "========================================="
echo ""

# Login to get a token
echo "5. Logging in to get JWT token..."
login_response=$(curl -s -c /tmp/cookies.txt -b /tmp/cookies.txt -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "member@test.com", "password": "member123"}')
echo "Login response: $login_response"
echo ""

# Extract token from cookies
token=$(grep -o 'Authentication[[:space:]]*[^;]*' /tmp/cookies.txt | awk '{print $NF}')
echo "Token: ${token:0:50}..."
echo ""

# Test autocomplete WITH auth
echo "6. Testing autocomplete endpoint WITH auth..."
response=$(curl -s -w "\n%{http_code}" -b /tmp/cookies.txt \
  "http://localhost:4000/api/location/autocomplete?query=Bangalore&limit=3")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "HTTP Code: $http_code"
echo "Response: $body" | jq . 2>/dev/null || echo "Response: $body"
echo ""

# Test reverse-geocode WITH auth
echo "7. Testing reverse-geocode endpoint WITH auth..."
response=$(curl -s -w "\n%{http_code}" -b /tmp/cookies.txt \
  "http://localhost:4000/api/location/reverse-geocode?lat=12.9716&lng=77.5946")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "HTTP Code: $http_code"
echo "Response: $body" | jq . 2>/dev/null || echo "Response: $body"
echo ""

# Test geocode WITH auth
echo "8. Testing geocode endpoint WITH auth..."
response=$(curl -s -w "\n%{http_code}" -b /tmp/cookies.txt \
  "http://localhost:4000/api/location/geocode?query=Bangalore")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "HTTP Code: $http_code"
echo "Response: $body" | jq . 2>/dev/null || echo "Response: $body"
echo ""

echo "========================================="
echo "Diagnostic test complete!"
echo "========================================="

# Cleanup
rm -f /tmp/cookies.txt
