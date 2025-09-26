const axios = require('axios');

async function seedCugData() {
  try {
    // First login to get auth token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'admin@opdwallet.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful');

    // Call the seed endpoint
    console.log('🌱 Seeding CUG data...');
    const seedResponse = await axios.post('http://localhost:4000/api/cugs/seed', {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ CUG data seeded successfully:', seedResponse.data);

    // Verify by getting all CUGs
    console.log('🔍 Verifying seeded data...');
    const getAllResponse = await axios.get('http://localhost:4000/api/cugs', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`📊 Found ${getAllResponse.data.total} CUGs in database:`);
    getAllResponse.data.data.forEach((cug, index) => {
      console.log(`${index + 1}. ${cug.cugId} - ${cug.name} (${cug.code})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('Details:', error.response.data.details);
    }
  }
}

seedCugData();