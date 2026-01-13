
import axios from 'axios';
import fs from 'fs';

const API_URL = 'http://localhost:5001/api';
const LOG_FILE = 'verify_output.txt';

if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

const log = (msg: string) => {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
};

async function runTest() {
    try {
        log('--- Starting Ownership Test ---');

        // 1. Login as Admin
        log('Logging in as Admin...');
        const adminRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@foxora.in',
            password: 'admin123'
        });
        const adminToken = adminRes.data.token;
        log('Admin logged in.');

        // 2. Create C1 and C2
        const c1Email = `c1_${Date.now()}@test.com`;
        const c2Email = `c2_${Date.now()}@test.com`;

        await axios.post(`${API_URL}/users`, {
            name: 'Temp Creator 1',
            email: c1Email,
            password: 'password123',
            role: 'CREATOR'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        await axios.post(`${API_URL}/users`, {
            name: 'Temp Creator 2',
            email: c2Email,
            password: 'password123',
            role: 'CREATOR'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });

        // Login as C1
        const loginC1 = await axios.post(`${API_URL}/auth/login`, { email: c1Email, password: 'password123' });
        const tokenC1 = loginC1.data.token;
        const idC1 = loginC1.data.user.id;
        log(`Logged in as C1: ${idC1}`);

        // Login as C2
        const loginC2 = await axios.post(`${API_URL}/auth/login`, { email: c2Email, password: 'password123' });
        const tokenC2 = loginC2.data.token;

        // 3. C1 Creates Task
        log('C1 Creating Task...');
        const taskRes = await axios.post(`${API_URL}/tasks`, {
            title: 'C1 Owned Task',
            priority: 'MEDIUM'
        }, { headers: { Authorization: `Bearer ${tokenC1}` } });
        const taskId = taskRes.data.id;
        log(`Task Created: ${taskId}, Owner: ${taskRes.data.createdById}`);

        if (taskRes.data.createdById !== idC1) {
            log('FAILED: createdById does not match Creator 1 ID');
        } else {
            log('PASSED: createdById matches Creator 1');
        }

        // 4. C2 Tries to Update
        log('C2 attempting to update C1 task...');
        try {
            await axios.put(`${API_URL}/tasks/${taskId}`, {
                title: 'C2 Hacked Title'
            }, { headers: { Authorization: `Bearer ${tokenC2}` } });
            log('FAILED: C2 was able to update C1 task!');
        } catch (e: any) {
            if (e.response && e.response.status === 403) {
                log('PASSED: C2 blocked from updating C1 task (403)');
            } else {
                log(`FAILED: Unexpected error code ${e.response?.status}`);
            }
        }

        // 5. Admin Tries to Update
        log('Admin attempting to update C1 task...');
        try {
            await axios.put(`${API_URL}/tasks/${taskId}`, {
                title: 'Admin Overridden Title'
            }, { headers: { Authorization: `Bearer ${adminToken}` } });
            log('PASSED: Admin successfully updated C1 task');
        } catch (e: any) {
            log(`FAILED: Admin blocked from updating: ${e.message}`);
        }

    } catch (error: any) {
        log('Test Failed Globally: ' + error.message);
        if (error.response) log('Response: ' + JSON.stringify(error.response.data));
    }
}

runTest();
