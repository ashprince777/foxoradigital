import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.user.update({
            where: { email: 'demo@example.com' },
            data: { role: 'SUPER_ADMIN' },
        });
        console.log('Fixed admin role');
    } catch (e) {
        console.error(e);
    }
}

main()
    .finally(async () => await prisma.$disconnect());
