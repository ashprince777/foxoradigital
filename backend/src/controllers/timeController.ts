import { Request, Response } from 'express';
import prisma from '../prisma';

export const startTimeEntry = async (req: Request, res: Response) => {
    try {
        const { taskId, description, isBillable } = req.body;
        const userId = (req as any).user.userId;

        const timeEntry = await prisma.timeEntry.create({
            data: {
                userId,
                taskId,
                description,
                isBillable: isBillable !== undefined ? isBillable : true,
                startTime: new Date(),
            },
        });

        res.json(timeEntry);
    } catch (error) {
        res.status(500).json({ error: 'Failed to start timer' });
    }
};

export const stopTimeEntry = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const timeEntry = await prisma.timeEntry.findUnique({ where: { id } });

        if (!timeEntry) {
            return res.status(404).json({ error: 'Time entry not found' });
        }

        const { idleDuration } = req.body;
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - new Date(timeEntry.startTime).getTime()) / 1000);

        const updatedEntry = await prisma.timeEntry.update({
            where: { id },
            data: {
                endTime,
                duration,
                idleDuration: idleDuration ? parseInt(idleDuration) : 0,
            },
        });

        res.json(updatedEntry);
    } catch (error) {
        res.status(500).json({ error: 'Failed to stop timer' });
    }
};

export const logManualTime = async (req: Request, res: Response) => {
    try {
        const { taskId, duration, description, date, isBillable } = req.body;
        const userId = (req as any).user.userId;

        const startTime = new Date(date);
        const endTime = new Date(startTime.getTime() + duration * 1000);

        const timeEntry = await prisma.timeEntry.create({
            data: {
                userId,
                taskId,
                startTime,
                endTime,
                duration: parseInt(duration),
                description,
                isBillable: isBillable !== undefined ? isBillable : true,
            }
        });

        res.json(timeEntry);
    } catch (error) {
        res.status(500).json({ error: 'Failed to log time' });
    }
};

export const getTimeEntries = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const entries = await prisma.timeEntry.findMany({
            where: { userId },
            orderBy: { startTime: 'desc' },
            include: { task: true }
        });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch time entries' });
    }
};

export const getProductivityStats = async (req: Request, res: Response) => {
    try {
        const currentUser = (req as any).user;
        let targetUserId = currentUser.userId;
        const { startDate, endDate, view, userId: requestedUserId } = req.query;

        // Admin/Super Admin Logic
        if ((currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && view === 'all') {
            // Fetch simplified stats for ALL users
            // Note: This logic is slightly different than detailed stats.
            // We want a list of users with their total time for the period.

            const allUsers = await prisma.user.findMany({
                where: { role: { not: 'CLIENT' } },
                select: { id: true, name: true, role: true }
            });

            const dateFilter: any = {};
            if (startDate && endDate) {
                dateFilter.startTime = {
                    gte: new Date(startDate as string),
                    lte: new Date(endDate as string),
                };
            }

            // Aggregation for all users (Completed Logged Time)
            const timeAggregations = await prisma.timeEntry.groupBy({
                by: ['userId'],
                where: {
                    ...dateFilter,
                    endTime: { not: null }
                },
                _sum: {
                    duration: true,
                    idleDuration: true
                },
                _max: {
                    endTime: true // Last active time
                }
            });

            // Fetch Active Sessions (Running Timers)
            const activeEntries = await prisma.timeEntry.findMany({
                where: {
                    endTime: null
                }
            });

            const userStats = allUsers.map(u => {
                const stats = timeAggregations.find(s => s.userId === u.id);
                const activeEntry = activeEntries.find(e => e.userId === u.id);

                let totalSeconds = stats?._sum.duration || 0;
                let idleSeconds = stats?._sum.idleDuration || 0;
                let lastActive = stats?._max.endTime || null;

                // Add active session time
                if (activeEntry) {
                    const currentDuration = Math.floor((Date.now() - new Date(activeEntry.startTime).getTime()) / 1000);
                    // Only add positive duration (in case of clock skew or whatever)
                    if (currentDuration > 0) {
                        totalSeconds += currentDuration;
                    }
                    idleSeconds += (activeEntry.idleDuration || 0);
                    lastActive = new Date(); // They are active right now
                }

                return {
                    id: u.id,
                    name: u.name,
                    role: u.role,
                    totalSeconds,
                    idleSeconds,
                    lastActive
                };
            });

            return res.json({ users: userStats });
        }

        // Specific User View for Admin
        if ((currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && requestedUserId) {
            targetUserId = requestedUserId as string;
        }

        const dateFilter: any = {};
        if (startDate && endDate) {
            dateFilter.startTime = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string),
            };
        }

        const entries = await prisma.timeEntry.findMany({
            where: {
                userId: targetUserId,
                ...dateFilter,
                endTime: { not: null } // Only completed entries
            },
            include: {
                task: {
                    include: {
                        project: true
                    }
                }
            }
        });

        let totalSeconds = 0;
        let billableSeconds = 0;
        let totalIdleSeconds = 0;

        const projectStats: Record<string, { name: string, seconds: number, color: string }> = {};
        const dailyStats: Record<string, number> = {};

        entries.forEach(entry => {
            const duration = entry.duration || 0;
            totalSeconds += duration;
            totalIdleSeconds += (entry.idleDuration || 0);

            if (entry.isBillable) {
                billableSeconds += duration;
            }

            // Project Stats
            const projectId = entry.task?.projectId || 'unknown';
            const projectName = entry.task?.project?.name || 'No Project';

            if (!projectStats[projectId]) {
                projectStats[projectId] = {
                    name: projectName,
                    seconds: 0,
                    // Assign a random color or consistent hash if possible, for now hardcoded or skipped
                    color: '#6366f1'
                };
            }
            projectStats[projectId].seconds += duration;

            // Daily Stats
            const dateKey = new Date(entry.startTime).toISOString().split('T')[0];
            dailyStats[dateKey] = (dailyStats[dateKey] || 0) + duration;
        });

        res.json({
            totalSeconds,
            billableSeconds,
            nonBillableSeconds: totalSeconds - billableSeconds,
            idleSeconds: totalIdleSeconds,
            projectStats: Object.values(projectStats),
            dailyStats
        });

    } catch (error) {
        console.error('Error fetching productivity stats:', error);
        res.status(500).json({ error: 'Failed to fetch productivity stats' });
    }
};

export const getCurrentEntry = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const activeEntry = await prisma.timeEntry.findFirst({
            where: {
                userId,
                endTime: null
            },
            include: { task: true }
        });
        res.json(activeEntry);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch active timer' });
    }
};
