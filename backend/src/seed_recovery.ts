
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Create Admin User
    const admin = await prisma.user.upsert({
        where: { email: 'admin@agencyflow.com' },
        update: {},
        create: {
            email: 'admin@agencyflow.com',
            name: 'Admin User',
            passwordHash: hashedPassword,
            role: 'ADMIN',
            status: 'ACTIVE'
        },
    });
    console.log('Admin user created:', admin.email);

    // 2. Create Test Client
    const client = await prisma.client.upsert({
        where: { email: 'client@test.com' },
        update: {},
        create: {
            name: 'TechStart Inc.',
            email: 'client@test.com',
            status: 'Active',
            portalAccess: true,
            posterDesignPrice: 50,
            videoEditingPrice: 100
        }
    });
    console.log('Test Client created:', client.name);

    // 3. Create Client User Login
    const clientUser = await prisma.user.upsert({
        where: { email: 'client@test.com' },
        update: {},
        create: {
            email: 'client@test.com',
            name: 'John Client',
            passwordHash: hashedPassword,
            role: 'CLIENT',
            status: 'ACTIVE'
        }
    });
    console.log('Client User created:', clientUser.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
