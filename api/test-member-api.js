const fetch = require('node-fetch');

async function testMemberAPI() {
  // First login as MEM003
  const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'anil.kumar@example.com',
      password: 'password123'
    })
  });

  const loginData = await loginResponse.json();
  console.log('=== LOGIN RESPONSE ===');
  console.log(JSON.stringify(loginData, null, 2));

  if (!loginData.accessToken) {
    console.error('Login failed!');
    return;
  }

  const token = loginData.accessToken;

  // Now call member profile API
  const profileResponse = await fetch('http://localhost:4000/api/member/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const profileData = await profileResponse.json();
  console.log('\n=== PROFILE API RESPONSE ===');
  console.log(JSON.stringify(profileData, null, 2));

  // Focus on assignments
  console.log('\n=== ASSIGNMENTS STRUCTURE ===');
  if (profileData.assignments) {
    profileData.assignments.forEach((a, i) => {
      console.log(`\nAssignment ${i}:`);
      console.log('  userId:', a.userId);
      console.log('  memberId:', a.memberId);
      console.log('  memberName:', a.memberName);
      console.log('  assignment:', a.assignment ? 'EXISTS' : 'NULL');

      if (a.assignment) {
        console.log('  assignment._id:', a.assignment._id);
        console.log('  assignment.policyId:', typeof a.assignment.policyId);
        console.log('  assignment.effectiveFrom:', a.assignment.effectiveFrom);
        console.log('  assignment.effectiveTo:', a.assignment.effectiveTo);

        if (a.assignment.policyId) {
          console.log('  assignment.policyId.policyNumber:', a.assignment.policyId.policyNumber);
          console.log('  assignment.policyId.effectiveFrom:', a.assignment.policyId.effectiveFrom);
          console.log('  assignment.policyId.effectiveTo:', a.assignment.policyId.effectiveTo);
        }
      }
    });
  }

  // Check user ID
  console.log('\n=== USER ID COMPARISON ===');
  console.log('user._id:', profileData.user._id);
  console.log('user.id:', profileData.user.id);

  if (profileData.assignments && profileData.assignments[0]) {
    console.log('assignment[0].userId:', profileData.assignments[0].userId);
    console.log('Match with _id?', profileData.assignments[0].userId === profileData.user._id);
    console.log('Match with id?', profileData.assignments[0].userId === profileData.user.id);
  }
}

testMemberAPI().catch(console.error);
