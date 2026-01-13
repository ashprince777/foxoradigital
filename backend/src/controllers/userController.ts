import { Request, Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { hashPassword } from '../utils/auth';

const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'CREATOR', 'CLIENT']).optional(),
    password: z.string().min(6).optional(),
    hourlyRate: z.number().optional(),
    capacity: z.number().int().optional(),
    status: z.string().optional(),
    allowedMenus: z.array(z.string()).optional(),
});

const createUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'CREATOR', 'CLIENT']).optional(),
    hourlyRate: z.number().optional(),
    capacity: z.number().int().optional(),
    status: z.string().optional(),
    allowedMenus: z.array(z.string()).optional(),
});

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, password, name, role, hourlyRate, capacity, status, allowedMenus } = createUserSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                role: role || 'CREATOR',
                hourlyRate,
                capacity,
                status: status || 'Active',
                allowedMenus: allowedMenus ? JSON.stringify(allowedMenus) : null
            },
            select: { id: true, email: true, name: true, role: true, createdAt: true, hourlyRate: true, capacity: true, status: true, allowedMenus: true },
        });

        res.status(201).json(user);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, role: true, createdAt: true, hourlyRate: true, capacity: true, status: true, allowedMenus: true },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: { id: true, email: true, name: true, role: true, createdAt: true, hourlyRate: true, capacity: true, status: true, allowedMenus: true },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = updateUserSchema.parse(req.body);
        const updateData: any = { ...data };

        if (data.allowedMenus) {
            updateData.allowedMenus = JSON.stringify(data.allowedMenus);
        }

        if (data.password) {
            updateData.passwordHash = await hashPassword(data.password);
            delete updateData.password;
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, email: true, name: true, role: true, createdAt: true, hourlyRate: true, capacity: true, status: true, allowedMenus: true },
        });
        res.json(user);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
