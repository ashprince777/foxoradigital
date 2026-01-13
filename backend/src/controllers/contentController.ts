import { Request, Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';

const createContentSchema = z.object({
    title: z.string().min(1),
    type: z.string(), // BLOG, SOCIAL, EMAIL
    status: z.string().optional(), // DRAFT, SCHEDULED, PUBLISHED
    scheduledDate: z.string().datetime().optional(),
    contentData: z.string().optional(),
    projectId: z.string().uuid(),
});

const updateContentSchema = createContentSchema.partial();

export const createContent = async (req: Request, res: Response) => {
    try {
        const data = createContentSchema.parse(req.body);

        const content = await prisma.contentItem.create({
            data: {
                ...data,
                status: data.status || 'DRAFT',
            },
        });
        res.status(201).json(content);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getAllContent = async (req: Request, res: Response) => {
    try {
        const content = await prisma.contentItem.findMany({
            include: { project: { select: { name: true } } },
        });
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getContentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const content = await prisma.contentItem.findUnique({
            where: { id },
            include: { project: true },
        });
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateContent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = updateContentSchema.parse(req.body);

        const content = await prisma.contentItem.update({
            where: { id },
            data,
        });
        res.json(content);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.issues });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteContent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.contentItem.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
