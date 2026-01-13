import { Request, Response } from 'express';
import prisma from '../prisma';
import fs from 'fs';
import path from 'path';

export const getSettings = async (req: Request, res: Response) => {
    try {
        let settings = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
        if (!settings) {
            settings = await prisma.systemSettings.create({ data: { id: 'default' } });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateSignature = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;

        // Get existing settings to delete old file if needed
        const existingSettings = await prisma.systemSettings.findUnique({ where: { id: 'default' } });
        if (existingSettings?.authorizedSignatureUrl) {
            const oldPath = path.join(__dirname, '../../', existingSettings.authorizedSignatureUrl);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const settings = await prisma.systemSettings.upsert({
            where: { id: 'default' },
            update: { authorizedSignatureUrl: fileUrl },
            create: { id: 'default', authorizedSignatureUrl: fileUrl },
        });

        res.json(settings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
