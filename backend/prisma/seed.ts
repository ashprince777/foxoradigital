import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const hashPassword = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

async function main() {
    const email = 'demo@example.com';
    const password = 'password123';
    const name = 'Demo User';
    const role = 'SUPER_ADMIN';

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (!existingUser) {
        const passwordHash = await hashPassword(password);
        await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                role,
            },
        });
        console.log('Demo user created');
    } else {
        console.log('Demo user already exists');
    }

    // Create Admin User (Foxora)
    const adminEmail = 'admin@foxora.in';
    const adminExisting = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!adminExisting) {
        const passwordHash = await hashPassword('admin123');
        await prisma.user.create({
            data: {
                email: adminEmail,
                passwordHash,
                name: 'Foxora Admin',
                role: 'ADMIN',
            },
        });
        console.log('Foxora Admin user created');
    } else {
        console.log('Foxora Admin user already exists');
    }

    // Create Creator User (Harsha)
    const creatorEmail = 'harsha@foxora.in';
    const creatorExisting = await prisma.user.findUnique({ where: { email: creatorEmail } });

    if (!creatorExisting) {
        const passwordHash = await hashPassword('harsha123'); // Assuming harsha123 or just 'pass' as previously tested? Let's use 'harsha123' and update test if needed.
        // Actually testOwnership had 'pass' or 'harsha123'?
        // The deleted testCreatorAccess had passwords.
        // I will use 'harsha123'.
        await prisma.user.create({
            data: {
                email: creatorEmail,
                passwordHash,
                name: 'Harsha Creator',
                role: 'CREATOR',
            },
        });
        console.log('Foxora Creator user created');
    } else {
        console.log('Foxora Creator user already exists');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
