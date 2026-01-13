
import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api';

async function testDashboard() {
    try {
        // 1. Login
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'demo@example.com',
            password: 'password123'
        });

        const token = loginRes.data.token;
        console.log('Login successful');

        // 2. Get Dashboard Stats
        const statsRes = await axios.get(`${BASE_URL}/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (statsRes.status === 200) {
            console.log('Dashboard stats retrieved successfully:');
            console.log(statsRes.data);
        } else {
            console.log('Failed to get dashboard stats');
            process.exit(1);
        }

    } catch (error: any) {
        console.error('Test Failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

testDashboard();
