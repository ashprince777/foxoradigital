
const http = require('http');

const data = JSON.stringify({
    email: 'demo@example.com',
    password: 'password123'
});

const options = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => console.log('Body:', body));
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
