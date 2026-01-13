
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.user.count();
    console.log(`User count: ${count}`);

    if (count === 0) {
        console.log('No users found. Database was likely reset.');
    } else {
        const users = await prisma.user.findMany();
        console.log('Users found:', users.map(u => u.email));
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
