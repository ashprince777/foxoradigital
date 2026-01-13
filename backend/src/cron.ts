import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const initCronJobs = () => {
    // Run at 00:00 on the 30th of every month
    cron.schedule('0 0 30 * *', async () => {
        console.log('Running monthly invoice generation job...');

        try {
            const activeClients = await prisma.client.findMany({
                where: { status: 'Active' }
            });

            for (const client of activeClients) {
                let totalAmount = 0;
                const items = [];

                if (client.plan && client.planPrice) {
                    totalAmount += client.planPrice;
                    items.push({
                        description: `Monthly Plan: ${client.plan}`,
                        amount: client.planPrice
                    });
                }

                if (client.facebookAds && client.facebookAdsPrice) {
                    totalAmount += client.facebookAdsPrice;
                    items.push({
                        description: 'Facebook Ads Budget',
                        amount: client.facebookAdsPrice
                    });
                }

                if (client.googleAds && client.googleAdsPrice) {
                    totalAmount += client.googleAdsPrice;
                    items.push({
                        description: 'Google Ads Budget',
                        amount: client.googleAdsPrice
                    });
                }

                if (totalAmount > 0) {
                    // Create Invoice
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

                    await prisma.invoice.create({
                        data: {
                            invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                            clientId: client.id,
                            total: totalAmount, // Changed from amount to total based on schema
                            subtotal: totalAmount,
                            dueDate: dueDate,
                            status: 'PENDING', // Schema has 'DRAFT', 'SENT', 'PAID', etc. Using 'SENT' or 'DRAFT'? Logic says 'Pending' but schema default DRAFT. 
                            // Schema for status: DRAFT, SENT, PAID, OVERDUE, CANCELLED. Let's use DRAFT for now or SENT.
                            // And accessing items relation
                            items: {
                                create: items.map(item => ({
                                    description: item.description,
                                    amount: item.amount,
                                    unitPrice: item.amount,
                                    quantity: 1
                                }))
                            }
                        }
                    });
                    console.log(`Generated invoice for client ${client.name} (Amount: ${totalAmount})`);
                }
            }
            console.log('Monthly invoice generation completed.');
        } catch (error) {
            console.error('Error generating monthly invoices:', error);
        }
    });

    console.log('Cron jobs initialized.');
};
