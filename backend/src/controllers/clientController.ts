import { Request, Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const createClientSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    address: z.string().optional(),
    status: z.string().optional(),
    brandColor: z.string().optional(),
    portalAccess: z.boolean().optional(),
    plan: z.string().optional(),
    facebookAds: z.boolean().optional(),
    googleAds: z.boolean().optional(),
    facebookAdsPrice: z.coerce.number().optional(),
    googleAdsPrice: z.coerce.number().optional(),
    posterDesignPrice: z.coerce.number().optional(),
    videoEditingPrice: z.coerce.number().optional(),
    aiVideoPrice: z.coerce.number().optional(),
    documentEditingPrice: z.coerce.number().optional(),
    otherWorkPrice: z.coerce.number().optional(),
});

const updateClientSchema = createClientSchema.partial();

const ensureClientUser = async (email: string, name: string) => {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (!existingUser) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('client123', salt);

        await prisma.user.create({
            data: {
                email,
                name,
                passwordHash,
                role: 'CLIENT',
                status: 'Active'
            }
        });
        console.log(`Created new user account for client: ${email}`);
    }
};

export const createClient = async (req: Request, res: Response) => {
    try {
        const data = createClientSchema.parse(req.body);

        const client = await prisma.client.create({
            data,
        });

        if (data.portalAccess && data.email) {
            await ensureClientUser(data.email, data.name);
        }

        res.status(201).json(client);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllClients = async (req: Request, res: Response) => {
    try {
        const clients = await prisma.client.findMany({
            include: { projects: { select: { id: true, name: true, status: true } } },
        });
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getClientById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const client = await prisma.client.findUnique({
            where: { id },
            include: { projects: true, invoices: true },
        });
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(client);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateClient = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const validatedData = updateClientSchema.parse(req.body);
        const client = await prisma.client.update({
            where: { id },
            data: validatedData
        });

        if (validatedData.portalAccess && client.email) {
            await ensureClientUser(client.email, client.name);
        }

        res.json(client);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues[0].message });
        }
        res.status(500).json({ error: 'Failed to update client' });
    }
};

export const deleteClient = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.client.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
