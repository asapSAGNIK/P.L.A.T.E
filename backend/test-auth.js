const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testAuth() {
  console.log('🧪 Testing Authentication Endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Register a new user
    console.log('2. Testing user registration...');
    const registerData = {
      email: 'test@example.com',
      password: 'testpassword123',
      name: 'Test User',
      cooking_skill_level: 'beginner',
      dietary_preferences: ['vegetarian'],
      allergies: ['nuts'],
      preferred_cuisines: ['italian', 'mexican']
    };

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, registerData);
    console.log('✅ Registration successful:', {
      message: registerResponse.data.message,
      userId: registerResponse.data.user.id,
      hasToken: !!registerResponse.data.token
    });
    console.log('');

    // Test 3: Login with the same user
    console.log('3. Testing user login...');
    const loginData = {
      email: 'test@example.com',
      password: 'testpassword123'
    };

    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, loginData);
    console.log('✅ Login successful:', {
      message: loginResponse.data.message,
      userId: loginResponse.data.user.id,
      hasToken: !!loginResponse.data.token
    });
    console.log('');

    // Test 4: Try to register the same user again (should fail)
    console.log('4. Testing duplicate registration (should fail)...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, registerData);
      console.log('❌ Duplicate registration should have failed');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('✅ Duplicate registration correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    console.log('');

    // Test 5: Try to login with wrong password (should fail)
    console.log('5. Testing wrong password login (should fail)...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      console.log('❌ Wrong password login should have failed');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Wrong password correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 All authentication tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAuth(); 