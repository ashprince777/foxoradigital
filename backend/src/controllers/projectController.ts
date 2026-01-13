import { Request, Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';

const createProjectSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    clientId: z.string().uuid(),
    startDate: z.string().datetime().optional(),
    dueDate: z.string().datetime().optional(),
    status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED', 'ON_HOLD']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    billingType: z.enum(['HOURLY', 'FIXED']).default('HOURLY'),
    budget: z.number().optional(),
});

const updateProjectSchema = createProjectSchema.partial();

export const createProject = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const user = req.user;

        if (user?.role === 'CLIENT') {
            // Fetch full user to get email
            const fullUser = await prisma.user.findUnique({
                where: { id: user.userId }
            });

            if (!fullUser) return res.status(401).json({ error: 'User not found' });

            const client = await prisma.client.findUnique({
                where: { email: fullUser.email }
            });

            if (!client) {
                return res.status(404).json({ error: 'Client profile not found. Please contact support.' });
            }

            req.body.clientId = client.id;
            // Default status for client requests
            if (!req.body.status) req.body.status = 'ON_HOLD';
        } else if (!req.body.clientId) {
            // Allow Admins/Managers to test the request flow without providing a clientId
            // We assign it to the first available client in the database
            const fallbackClient = await prisma.client.findFirst();
            if (fallbackClient) {
                req.body.clientId = fallbackClient.id;
                if (!req.body.status) req.body.status = 'ON_HOLD';
            }
        }

        const data = createProjectSchema.parse(req.body);

        let managerId = undefined;
        if (user?.role !== 'CLIENT') {
            managerId = user?.userId;
        }

        const project = await prisma.project.create({
            data: {
                ...data,
                managerId,
                createdById: user?.userId
            },
        });
        res.status(201).json(project);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        console.error('Create Project Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllProjects = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        let where = {};

        if (user.role === 'CLIENT') {
            const fullUser = await prisma.user.findUnique({ where: { id: user.userId } });
            if (!fullUser) return res.json([]);

            const client = await prisma.client.findUnique({
                where: { email: fullUser.email }
            });

            if (!client) {
                return res.json([]); // Client profile not found for this user
            }
            where = { clientId: client.id };
        }

        const projects = await prisma.project.findMany({
            where,
            include: {
                client: true,
                manager: { select: { id: true, name: true } },
                creator: { select: { id: true, name: true } }
            },
        });
        res.json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getProjectById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                client: true,
                manager: { select: { id: true, name: true } },
                creator: { select: { id: true, name: true } },
                tasks: true
            },
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = updateProjectSchema.parse(req.body);

        const user = (req as any).user;
        const existingProject = await prisma.project.findUnique({ where: { id } });
        if (!existingProject) return res.status(404).json({ error: 'Project not found' });

        const isCreator = existingProject.createdById === user.userId;
        const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
        const isManager = existingProject.managerId === user.userId; // Also allow assigned manager to edit

        if (!isCreator && !isAdmin && !isManager) {
            return res.status(403).json({ error: 'You do not have permission to edit this project' });
        }

        const project = await prisma.project.update({
            where: { id },
            data,
        });
        res.json(project);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        console.error('Update Project Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteProject = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as any).user;
        const existingProject = await prisma.project.findUnique({ where: { id } });
        if (!existingProject) return res.status(404).json({ error: 'Project not found' });

        const isCreator = existingProject.createdById === user.userId;
        const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

        if (!isCreator && !isAdmin) {
            return res.status(403).json({ error: 'You do not have permission to delete this project' });
        }

        await prisma.project.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
