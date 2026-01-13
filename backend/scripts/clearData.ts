
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearData() {
  console.log('Starting data cleanup...');

  try {
    // Delete in order to respect foreign key constraints
    
    // 1. Level 4 Dependencies (Leaves)
    console.log('Deleting InvoiceItems...');
    await prisma.invoiceItem.deleteMany({});

    console.log('Deleting Subtasks...');
    await prisma.subtask.deleteMany({});
    
    console.log('Deleting TimeEntries...');
    await prisma.timeEntry.deleteMany({});
    
    console.log('Deleting Comments...');
    await prisma.comment.deleteMany({});

    // 2. Level 3 Dependencies
    // Tasks depend on Projects, Clients, Users, Invoices.
    // However, Invoices depend on Clients. 
    // Tasks might reference Invoices.
    // Let's clear Tasks first as they are often leaf-ish or central connectors.
    console.log('Deleting Tasks...');
    await prisma.task.deleteMany({});

    console.log('Deleting ContentItems...');
    await prisma.contentItem.deleteMany({});
    
    // 3. Level 2 Dependencies
    console.log('Deleting Projects...');
    await prisma.project.deleteMany({});
    
    console.log('Deleting Invoices...');
    await prisma.invoice.deleteMany({});

    console.log('Deleting Payments...');
    await prisma.payment.deleteMany({});

    // 4. Level 1 Dependencies
    console.log('Deleting Clients...');
    await prisma.client.deleteMany({});

    console.log('Data cleanup completed successfully. Users and SystemSettings were preserved.');

  } catch (error) {
    console.error('Error clearing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
