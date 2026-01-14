import { Request, Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { toWords } from 'number-to-words';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const invoiceItemSchema = z.object({
    description: z.string().min(1),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
});

const createInvoiceSchema = z.object({
    clientId: z.string().uuid(),
    dueDate: z.string().datetime(),
    status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']).default('DRAFT'),
    items: z.array(invoiceItemSchema).min(1),
    notes: z.string().optional(),
    taxRate: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
});

const updateInvoiceSchema = z.object({
    status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']),
});

const recordPaymentSchema = z.object({
    clientId: z.string().uuid(),
    amount: z.number().positive(),
    paymentDate: z.string(),
    paymentMethod: z.string(),
    transactionId: z.string().optional(),
    notes: z.string().optional(),
});

// Helper to generate Invoice Number
const generateInvoiceNumber = async () => {
    const lastInvoice = await prisma.invoice.findFirst({
        orderBy: { invoiceNumber: 'desc' },
    });

    if (!lastInvoice) return 'INV-00001';

    // Extract number part
    const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
    if (match) {
        const lastNum = parseInt(match[1], 10);
        return `INV-${String(lastNum + 1).padStart(5, '0')}`;
    }

    const count = await prisma.invoice.count();
    return `INV-${String(count + 1).padStart(5, '0')}`;
}

export const getInvoices = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        let where: any = {};

        if (user.role === 'CLIENT') {
            const client = await prisma.client.findUnique({ where: { email: user.email } });
            if (!client) return res.json([]);
            where = { clientId: client.id };
        }

        const invoices = await prisma.invoice.findMany({
            where,
            include: { client: true, items: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(invoices);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createInvoice = async (req: Request, res: Response) => {
    try {
        const data = createInvoiceSchema.parse(req.body);

        // Calculate totals
        const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxAmount = subtotal * ((data.taxRate || 0) / 100);
        const total = subtotal + taxAmount - (data.discount || 0);

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber: await generateInvoiceNumber(),
                clientId: data.clientId,
                dueDate: new Date(data.dueDate),
                status: data.status,
                subtotal,
                taxRate: data.taxRate || 0,
                taxAmount,
                discount: data.discount || 0,
                total,
                notes: data.notes,
                items: {
                    create: data.items.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        amount: item.quantity * item.unitPrice
                    }))
                }
            },
            include: { items: true }
        });
        res.status(201).json(invoice);
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateInvoiceStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = updateInvoiceSchema.parse(req.body);
        const invoice = await prisma.invoice.update({
            where: { id },
            data: { status }
        });
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const downloadInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { client: true, items: true }
        });

        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        if (invoice.status === 'DRAFT') {
            await prisma.invoice.update({ where: { id }, data: { status: 'SENT' } });
        }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoiceNumber}.pdf`);

        doc.pipe(res);

        // --- Header ---
        const logoPath = path.join(__dirname, '../../../frontend/public/foxora-logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 80 });
        } else {
            // Fallback if logo invalid, though we verified it exists
            doc.fontSize(20).text('Foxora', 50, 45);
        }

        const companyX = 150;
        doc.font('Helvetica-Bold').fontSize(16).text('Foxora Digital LLP', companyX, 50);
        doc.font('Helvetica').fontSize(10)
            .text('Thundiyil building, M kanaran Road, East Nadakkave', companyX, 75)
            .text('Nadakkave, Kozhikode, Kerala 673006', companyX, 90)
            .text('India', companyX, 105)
            .text('9809725430', companyX, 120)
            .text('hello@foxora.in', companyX, 135)
            .text('foxora.in', companyX, 150);

        doc.font('Helvetica-Bold').fontSize(24).text('TAX INVOICE', 350, 50, { align: 'right' });

        // --- Metadata Box ---
        const metaY = 200;
        doc.rect(50, metaY, 500, 85).stroke();
        doc.moveTo(280, metaY).lineTo(280, metaY + 85).stroke(); // Vertical divider

        const metaLeftX = 60;
        const metaRightX = 180;

        const drawMetaRow = (label: string, value: string, y: number) => {
            doc.font('Helvetica-Bold').fontSize(10).text(label, metaLeftX, y);
            doc.font('Helvetica-Bold').text(': ' + value, metaRightX, y);
        };

        drawMetaRow('Invoice#', invoice.invoiceNumber, metaY + 10);
        drawMetaRow('Invoice Date', new Date(invoice.createdAt).toLocaleDateString(), metaY + 25);
        drawMetaRow('Terms', 'Due on Receipt', metaY + 40);
        drawMetaRow('Due Date', new Date(invoice.dueDate).toLocaleDateString(), metaY + 55);
        drawMetaRow('P.O.#', '1', metaY + 70);

        // --- Bill To ---
        const billY = metaY + 100;
        doc.rect(50, billY, 500, 25).fill('#e0e0e0').stroke();
        doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text('Bill To', 60, billY + 8);

        doc.rect(50, billY + 25, 500, 60).stroke(); // Bill To Body
        doc.font('Helvetica-Bold').fontSize(12).text(invoice.client.name, 60, billY + 35, { width: 480 });
        doc.font('Helvetica').fontSize(10).text(invoice.client.address || invoice.client.email || '', 60, billY + 50, { width: 480 });
        doc.text(invoice.client.phone || '', 60, billY + 65);
        doc.text('India', 60, billY + 80);

        // --- Items Table ---
        const tableTop = billY + 100;
        const itemCodeX = 50;
        const descriptionX = 100;
        const qtyX = 350;
        const rateX = 400;
        const amountX = 480;

        // Table Header
        doc.rect(50, tableTop, 500, 25).fill('#f0f0f0').stroke();
        doc.fillColor('black').font('Helvetica-Bold').fontSize(10);
        doc.text('#', 60, tableTop + 8);
        doc.text('Item & Description', descriptionX, tableTop + 8);
        doc.text('Qty', qtyX, tableTop + 8);
        doc.text('Rate', rateX, tableTop + 8, { width: 50, align: 'right' });
        doc.text('Amount', amountX, tableTop + 8, { width: 60, align: 'right' });

        let y = tableTop + 25;
        doc.font('Helvetica').fontSize(10);

        invoice.items.forEach((item, i) => {
            const yStart = y;
            doc.text((i + 1).toString(), 60, y + 5);
            doc.text(item.description, descriptionX, y + 5, { width: 230 });
            doc.text(item.quantity.toString(), qtyX, y + 5);
            doc.text(item.unitPrice.toFixed(2), rateX, y + 5, { width: 50, align: 'right' });
            doc.text((item.quantity * item.unitPrice).toFixed(2), amountX, y + 5, { width: 60, align: 'right' });

            // Calculate height of description
            const height = doc.heightOfString(item.description, { width: 230 });
            y += Math.max(height, 20) + 10;

            // Horizontal line
            doc.moveTo(50, y).lineTo(550, y).strokeColor('#e0e0e0').stroke().strokeColor('black');
        });

        // --- Footer / Totals ---
        const footerY = y + 10;
        const totalLabelX = 350;
        const totalValueX = 450;

        doc.font('Helvetica-Bold').text('Sub Total', totalLabelX, footerY, { align: 'right', width: 100 });
        doc.text(invoice.subtotal.toFixed(2), totalValueX, footerY, { align: 'right', width: 90 });

        doc.text('Total', totalLabelX, footerY + 20, { align: 'right', width: 100 });
        doc.text('Rs. ' + invoice.total.toFixed(2), totalValueX, footerY + 20, { align: 'right', width: 90 });

        doc.text('Balance Due', totalLabelX, footerY + 40, { align: 'right', width: 100 });
        doc.text('Rs. ' + invoice.total.toFixed(2), totalValueX, footerY + 40, { align: 'right', width: 90 });

        // Total in words
        doc.font('Helvetica-Oblique').fontSize(10).text('Total In Words', 50, footerY);
        const integerPart = Math.floor(invoice.total); // number-to-words works best with integers
        const words = toWords(integerPart);
        doc.font('Helvetica-BoldOblique').text(`${words.charAt(0).toUpperCase() + words.slice(1)} Only`, 50, footerY + 15);

        // Notes
        if (invoice.notes) {
            doc.font('Helvetica').fontSize(9).text('Notes:', 50, footerY + 40);
            doc.text(invoice.notes, 50, footerY + 55, { width: 250 });
        }

        doc.fontSize(10).text('Thanks for your business.', 50, footerY + 80);

        // Check for page break before signature
        if (doc.y + 150 > doc.page.height - 50) {
            doc.addPage();
        } else {
            doc.moveDown(2);
        }

        const sigStartX = 400;
        const sigStartY = doc.y;

        // Signature image
        let signatureHeight = 0;
        const settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
        if (settings?.authorizedSignatureUrl) {
            try {
                let signatureBuffer: Buffer | null = null;
                if (settings.authorizedSignatureUrl.startsWith('http')) {
                    const response = await axios.get(settings.authorizedSignatureUrl, { responseType: 'arraybuffer' });
                    signatureBuffer = Buffer.from(response.data);
                } else {
                    const signaturePath = path.join(__dirname, '../../', settings.authorizedSignatureUrl);
                    if (fs.existsSync(signaturePath)) {
                        signatureBuffer = fs.readFileSync(signaturePath);
                    }
                }

                if (signatureBuffer) {
                    doc.image(signatureBuffer, sigStartX, sigStartY, { width: 150 });
                    signatureHeight = 60; // Approximate height for spacing
                }
            } catch (error) {
                console.error('Failed to load signature image:', error);
                doc.fontSize(12).font('Helvetica-Oblique').text('Signed', sigStartX, sigStartY);
                signatureHeight = 20;
            }
        } else {
            // Default Fallback Logo
            try {
                const logoPath = path.join(__dirname, '../../../frontend/public/foxora-logo.png');
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, sigStartX, sigStartY, { width: 60, height: 30 });
                    signatureHeight = 40;
                }
            } catch (e) { /* ignore */ }
        }

        doc.fontSize(9).font('Helvetica').text('Authorized Signature', sigStartX, sigStartY + signatureHeight + 10);

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const recordPayment = async (req: Request, res: Response) => {
    try {
        const { clientId, amount, paymentDate, paymentMethod, transactionId, notes } = recordPaymentSchema.parse(req.body);

        // Create Payment Record
        const payment = await prisma.payment.create({
            data: {
                clientId,
                amount,
                paymentDate: new Date(paymentDate),
                paymentMethod,
                transactionId,
                notes
            }
        });

        let remainingAmount = amount;

        const unpaidInvoices = await prisma.invoice.findMany({
            where: { clientId, status: { in: ['SENT', 'DRAFT', 'OVERDUE'] } },
            orderBy: { createdAt: 'asc' }
        });

        const updatedInvoices = [];

        for (const invoice of unpaidInvoices) {
            if (remainingAmount <= 0) break;
            if (remainingAmount >= invoice.total) {
                const updated = await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: { status: 'PAID' }
                });
                updatedInvoices.push(updated);
                remainingAmount -= invoice.total;
            }
        }
        res.json({ message: 'Payment recorded', payment, updatedInvoices, remainingCredit: remainingAmount });
    } catch (error) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
        res.status(500).json({ error: 'Internal server error' });
    }
};

// --- New Endpoints ---

export const getPendingAmounts = async (req: Request, res: Response) => {
    try {
        const tasks = await prisma.task.findMany({
            where: {
                scheduledDate: { not: null },
                serviceType: { not: null },
                status: { in: ['DONE', 'DISCOUNTED'] },
                invoiceId: null,
                OR: [
                    { clientId: { not: null } },
                    { project: { clientId: { not: undefined } } } // Keep legacy support
                ]
            },
            include: { client: true, project: { include: { client: true } } }
        });

        const clientPending: Record<string, { client: any, amount: number, discounted: number, taskIds: string[] }> = {};

        for (const task of tasks) {
            const client = task.client || task.project?.client;
            if (!client) continue;

            let price = 0;
            switch (task.serviceType) {
                case 'Poster Design': price = client.posterDesignPrice || 0; break;
                case 'Video Editing': price = client.videoEditingPrice || 0; break;
                case 'AI Video': price = client.aiVideoPrice || 0; break;
                case 'Document Editing': price = client.documentEditingPrice || 0; break;
                case 'Other Work': price = client.otherWorkPrice || 0; break;
            }

            if (price > 0) {
                if (!clientPending[client.id]) {
                    clientPending[client.id] = { client, amount: 0, discounted: 0, taskIds: [] };
                }

                if (task.status === 'DONE') {
                    clientPending[client.id].amount += price;
                } else if (task.status === 'DISCOUNTED') {
                    clientPending[client.id].discounted += price;
                }

                clientPending[client.id].taskIds.push(task.id);
            }
        }

        res.json(Object.values(clientPending));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const applyDiscount = async (req: Request, res: Response) => {
    try {
        const { clientId, amount } = z.object({ clientId: z.string(), amount: z.number().positive() }).parse(req.body);
        let remaining = amount;

        // Find billable tasks (DONE)
        const tasks = await prisma.task.findMany({
            where: {
                status: 'DONE',
                invoiceId: null,
                serviceType: { not: null },
                OR: [
                    { clientId },
                    { project: { clientId } }
                ]
            },
            orderBy: { scheduledDate: 'asc' },
            include: { client: true, project: { include: { client: true } } }
        });

        const updatedIds = [];

        for (const task of tasks) {
            if (remaining <= 0) break;

            const client = task.client || task.project?.client;
            if (!client) continue;

            let price = 0;
            switch (task.serviceType) {
                case 'Poster Design': price = client.posterDesignPrice || 0; break;
                case 'Video Editing': price = client.videoEditingPrice || 0; break;
                case 'AI Video': price = client.aiVideoPrice || 0; break;
                case 'Document Editing': price = client.documentEditingPrice || 0; break;
                case 'Other Work': price = client.otherWorkPrice || 0; break;
            }

            if (price > 0 && price <= remaining + 0.01) {
                updatedIds.push(task.id);
                remaining -= price;
            }
        }

        if (updatedIds.length > 0) {
            await prisma.task.updateMany({
                where: { id: { in: updatedIds } },
                data: { status: 'DISCOUNTED' }
            });
        }
        res.json({ message: 'Discount applied', appliedDetails: updatedIds, remainingDiscount: remaining });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const generateMonthlyInvoices = async (req: Request, res: Response) => {
    try {
        const { clientIds } = z.object({ clientIds: z.array(z.string()) }).parse(req.body);
        const generatedInvoices = [];

        for (const clientId of clientIds) {
            const tasks = await prisma.task.findMany({
                where: {
                    scheduledDate: { not: null },
                    serviceType: { not: null },
                    status: 'DONE',
                    invoiceId: null,
                    OR: [
                        { clientId },
                        { project: { clientId } }
                    ]
                },
                include: { client: true, project: { include: { client: true } } }
            });

            if (tasks.length === 0) continue;

            const client = tasks[0].client || tasks[0].project?.client;
            if (!client) continue; // Should not happen given query but safely handle
            const items = [];
            let subtotal = 0;

            for (const task of tasks) {
                let price = 0;
                switch (task.serviceType) {
                    case 'Poster Design': price = client.posterDesignPrice || 0; break;
                    case 'Video Editing': price = client.videoEditingPrice || 0; break;
                    case 'AI Video': price = client.aiVideoPrice || 0; break;
                    case 'Document Editing': price = client.documentEditingPrice || 0; break;
                    case 'Other Work': price = client.otherWorkPrice || 0; break;
                }
                if (price > 0) {
                    items.push({
                        description: `${task.serviceType} - ${task.title} (${new Date(task.scheduledDate!).toLocaleDateString()})`,
                        quantity: 1,
                        unitPrice: price,
                        amount: price
                    });
                    subtotal += price;
                }
            }

            if (items.length > 0) {
                const invoice = await prisma.invoice.create({
                    data: {
                        invoiceNumber: await generateInvoiceNumber(),
                        clientId: client.id,
                        dueDate: new Date(new Date().setDate(new Date().getDate() + 14)), // 14 days due
                        status: 'DRAFT',
                        subtotal,
                        total: subtotal,
                        items: { create: items },
                        tasks: { connect: tasks.map(t => ({ id: t.id })) }
                    }
                });
                generatedInvoices.push(invoice);
            }
        }

        res.json({ generated: generatedInvoices.length, invoices: generatedInvoices });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const generateCustomInvoice = async (req: Request, res: Response) => {
    try {
        const { clientId, fromDate, toDate } = z.object({
            clientId: z.string().uuid(),
            fromDate: z.string(),
            toDate: z.string()
        }).parse(req.body);

        const start = new Date(fromDate);
        const end = new Date(toDate);
        // Adjust end date to include the full day if it's just a date string
        end.setHours(23, 59, 59, 999);

        const tasks = await prisma.task.findMany({
            where: {
                scheduledDate: {
                    gte: start,
                    lte: end
                },
                serviceType: { not: null },
                status: 'DONE',
                invoiceId: null,
                OR: [
                    { clientId },
                    { project: { clientId } }
                ]
            },
            include: { client: true, project: { include: { client: true } } }
        });

        if (tasks.length === 0) {
            return res.status(404).json({ error: 'No billable tasks found for this period' });
        }

        const client = tasks[0].client || tasks[0].project?.client;
        if (!client) return res.status(400).json({ error: 'Client not found' });

        const items = [];
        let subtotal = 0;

        for (const task of tasks) {
            let price = 0;
            switch (task.serviceType) {
                case 'Poster Design': price = client.posterDesignPrice || 0; break;
                case 'Video Editing': price = client.videoEditingPrice || 0; break;
                case 'AI Video': price = client.aiVideoPrice || 0; break;
                case 'Document Editing': price = client.documentEditingPrice || 0; break;
                case 'Other Work': price = client.otherWorkPrice || 0; break;
            }
            if (price > 0) {
                items.push({
                    description: `${task.serviceType} - ${task.title} (${new Date(task.scheduledDate!).toLocaleDateString()})`,
                    quantity: 1,
                    unitPrice: price,
                    amount: price
                });
                subtotal += price;
            }
        }

        if (items.length === 0) {
            return res.status(400).json({ error: 'Tasks found but no prices defined' });
        }

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber: await generateInvoiceNumber(),
                clientId: client.id,
                dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
                status: 'DRAFT',
                subtotal,
                total: subtotal,
                items: { create: items },
                tasks: { connect: tasks.map(t => ({ id: t.id })) }
            },
            include: { items: true }
        });

        res.status(201).json(invoice);

    } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues });
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteInvoice = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { tasks: true }
        });

        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

        // Unlink tasks
        if (invoice.tasks.length > 0) {
            await prisma.task.updateMany({
                where: { invoiceId: id },
                data: { invoiceId: null }
            });
        }

        await prisma.invoice.delete({ where: { id } });

        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
