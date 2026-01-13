import { Request, Response } from 'express';
import prisma from '../prisma';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'CREATOR', 'CLIENT']).optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name, role } = registerSchema.parse(req.body);

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
            },
        });

        const token = generateToken(user.id, user.role);
        res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        console.log('Login attempt:', req.body.email);
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ error: `DEBUG: User not found in DB (${email})` });
        }
        console.log('User found:', user.email, 'Role:', user.role);

        const isValid = await comparePassword(password, user.passwordHash);
        console.log('Password valid:', isValid);

        if (!isValid) {
            return res.status(401).json({ error: `DEBUG: Password Invalid. Hash: ${user.passwordHash.substring(0, 10)}...` });
        }

        const token = generateToken(user.id, user.role);
        res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, allowedMenus: user.allowedMenus } });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getMe = async (req: Request, res: Response) => {
    // @ts-ignore
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, allowedMenus: user.allowedMenus } });
    } catch (error: any) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
