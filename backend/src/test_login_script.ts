
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@agencyflow.com';
    const password = 'password123';

    console.log(`Testing login for: ${email}`);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.error('User NOT FOUND in DB');
        return;
    }

    console.log('User found:', user.id, user.role);
    console.log('Stored Hash:', user.passwordHash);

    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log(`Password '${password}' matches hash? ${isValid}`);

    // Generate a fresh hash to see if it differs significantly (salt diff is normal, but just checking logic)
    const newHash = await bcrypt.hash(password, 10);
    console.log('Fresh Hash:', newHash);
    const newValid = await bcrypt.compare(password, newHash);
    console.log('Fresh Hash check:', newValid);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
