
import axios from 'axios';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5001/api';

async function testPdf() {
    try {
        // 1. Login
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@agencyflow.com',
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('Login successful');

        // 2. Find an invoice
        const invoice = await prisma.invoice.findFirst();
        if (!invoice) {
            console.log('No invoices found to test');
            return;
        }

        console.log('Testing Invoice:', invoice.id);

        // 3. Download PDF
        const response = await axios.get(`${API_URL}/invoices/${invoice.id}/download`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer'
        });

        if (response.status === 200) {
            fs.writeFileSync('test_invoice.pdf', response.data);
            console.log('PDF downloaded successfully: test_invoice.pdf');
        } else {
            console.log('PDF download failed', response.status);
        }

    } catch (error: any) {
        console.error('Test Failed:', error.response?.data || error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testPdf();
