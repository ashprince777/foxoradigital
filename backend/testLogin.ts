
import axios from 'axios';

const API_URL = 'http://localhost:5001/api/auth/login';

async function testLogin() {
    try {
        const response = await axios.post(API_URL, {
            email: 'demo@example.com',
            password: 'password123'
        });

        if (response.status === 200 && response.data.token) {
            console.log('Login SUCCESS! Token received.');
            console.log('User:', response.data.user.name);
        } else {
            console.log('Login FAILED. Unexpected response:', response.data);
            process.exit(1);
        }
    } catch (error: any) {
        console.error('Login FAILED. Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

testLogin();
