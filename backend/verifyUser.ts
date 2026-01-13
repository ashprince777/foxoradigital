
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.findUnique({ where: { email: 'demo@example.com' } });
    console.log(user ? 'User found' : 'User NOT found');
    await prisma.$disconnect();
}
main();
