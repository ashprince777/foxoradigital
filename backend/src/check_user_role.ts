import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'demo@example.com';
    const user = await prisma.user.findUnique({ where: { email } });
    console.log('User Role:', user?.role);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
