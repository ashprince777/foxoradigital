import { Request, Response } from 'express';
import prisma from '../prisma';
import { supabase } from '../lib/supabase';

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
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const fileExt = file.originalname.split('.').pop();
        const fileName = `signature-${Date.now()}.${fileExt}`;
        const filePath = `signatures/${fileName}`; // Folder 'signatures' in bucket 'uploads' or root? Let's simply put in root or 'system'.

        // Upload to Supabase Storage
        // Bucket name assumption: 'uploads'
        const { data, error: uploadError } = await supabase
            .storage
            .from('uploads')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            return res.status(500).json({ error: 'Failed to upload to storage', details: uploadError.message });
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(fileName);

        // Update DB
        const settings = await prisma.systemSettings.upsert({
            where: { id: 'default' },
            update: { authorizedSignatureUrl: publicUrl },
            create: { id: 'default', authorizedSignatureUrl: publicUrl },
        });

        res.json(settings);
    } catch (error) {
        console.error('Update Signature Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
