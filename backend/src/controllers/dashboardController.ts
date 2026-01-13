import { Request, Response } from 'express';
import prisma from '../prisma';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const now = new Date();

        const [activeProjects, totalTasks, overdueTasks, totalClients, recentProjects, upcomingDeadlines, timeEntriesRaw] = await Promise.all([
            prisma.project.count({
                where: {
                    status: 'ACTIVE',
                },
            }),
            prisma.task.count(),
            prisma.task.count({
                where: {
                    dueDate: {
                        lt: now,
                    },
                    status: {
                        not: 'DONE',
                    },
                },
            }),
            prisma.client.count(),
            prisma.project.findMany({
                take: 5,
                orderBy: {
                    createdAt: 'desc',
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    status: true,
                },
            }),
            prisma.task.findMany({
                where: {
                    dueDate: {
                        gt: now,
                    },
                    status: {
                        not: 'DONE',
                    },
                },
                take: 5,
                orderBy: {
                    dueDate: 'asc',
                },
                select: {
                    id: true,
                    title: true,
                    dueDate: true,
                    priority: true,
                },
            }),
            prisma.timeEntry.aggregate({
                _sum: {
                    duration: true,
                },
                where: {
                    userId: (req as any).user?.userId,
                },
            }),
        ]);

        const totalHoursLogged = timeEntriesRaw._sum.duration ? Math.round(timeEntriesRaw._sum.duration / 3600 * 10) / 10 : 0;

        res.json({
            activeProjects,
            totalTasks,
            overdueTasks,
            totalClients,
            recentProjects,
            upcomingDeadlines,
            totalHoursLogged,
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
