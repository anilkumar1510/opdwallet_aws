const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('Testing doctor login...');
    console.log('Email: doctor@doctor.com');
    console.log('URL: http://localhost:4000/api/auth/doctor/login\n');

    const response = await fetch('http://localhost:4000/api/auth/doctor/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'doctor@doctor.com',
        password: 'password123', // Try common test password
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    console.log('Content-Type:', response.headers.get('content-type'));

    const text = await response.text();
    console.log('\nResponse body:');
    console.log(text);

    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const data = JSON.parse(text);
        console.log('\nParsed JSON:');
        console.log(JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('Failed to parse as JSON');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();
