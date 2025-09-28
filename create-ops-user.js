const fetch = require('node-fetch');

async function createOpsUser() {
  try {
    // First, login as admin to get auth token
    const loginRes = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@opdwallet.com',
        password: 'admin123'
      })
    });

    if (!loginRes.ok) {
      console.error('Failed to login as admin');
      return;
    }

    const cookies = loginRes.headers.get('set-cookie');

    // Create OPS user
    const userData = {
      email: 'ops@opdwallet.com',
      password: 'ops123',
      role: 'OPS',
      status: 'ACTIVE',
      name: {
        firstName: 'Operations',
        lastName: 'User'
      },
      phone: '+919876543210'
    };

    const createRes = await fetch('http://localhost:4000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(userData)
    });

    if (createRes.ok) {
      const user = await createRes.json();
      console.log('✅ Operations user created successfully!');
      console.log('Email: ops@opdwallet.com');
      console.log('Password: ops123');
      console.log('User ID:', user._id);
    } else {
      const error = await createRes.text();
      console.error('Failed to create user:', error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createOpsUser();