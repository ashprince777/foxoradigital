import { Request, Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';

const createTaskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    projectId: z.string().uuid().optional(),
    clientId: z.string().uuid().optional(),
    assigneeId: z.string().optional(),
    dueDate: z.string().optional(),
    scheduledDate: z.string().optional(),
    serviceType: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
});

const updateTaskSchema = createTaskSchema.partial();

export const createTask = async (req: Request, res: Response) => {
    try {
        const data = createTaskSchema.parse(req.body);

        const user = (req as any).user;
        const task = await prisma.task.create({
            data: {
                ...data,
                createdById: user?.userId
            },
        });
        res.status(201).json(task);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllTasks = async (req: Request, res: Response) => {
    try {
        const tasks = await prisma.task.findMany({
            include: {
                project: { select: { name: true } },
                client: { select: { name: true } },
                assignee: { select: { name: true } },
                creator: { select: { id: true, name: true } }
            },
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getTaskById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const task = await prisma.task.findUnique({
            where: { id },
            include: {
                project: true,
                client: true,
                assignee: { select: { id: true, name: true } },
                creator: { select: { id: true, name: true } },
                subtasks: true,
                comments: true
            },
        });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = updateTaskSchema.parse(req.body);

        const user = (req as any).user;

        // 1. Fetch task to check ownership
        const existingTask = await prisma.task.findUnique({ where: { id } });
        if (!existingTask) return res.status(404).json({ error: 'Task not found' });

        // 2. Check Permissions
        const isCreator = existingTask.createdById === user.userId;
        const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

        if (!isCreator && !isAdmin) {
            return res.status(403).json({ error: 'You do not have permission to edit this task' });
        }

        const task = await prisma.task.update({
            where: { id },
            data,
            include: { project: true, client: true, creator: { select: { name: true } } }
        });

        // Auto-invoice removed in favor of "Generate Monthly" / Bulk Invoicing.
        // We ensure data is saved so it can be picked up later.

        res.json(task);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteTask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = (req as any).user;
        const existingTask = await prisma.task.findUnique({ where: { id } });
        if (!existingTask) return res.status(404).json({ error: 'Task not found' });

        const isCreator = existingTask.createdById === user.userId;
        const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

        if (!isCreator && !isAdmin) {
            return res.status(403).json({ error: 'You do not have permission to delete this task' });
        }

        await prisma.task.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
