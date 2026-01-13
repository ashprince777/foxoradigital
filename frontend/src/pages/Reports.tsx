import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Clock, DollarSign, PieChart, Info, Users, User as UserIcon, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProjectStat {
    name: string;
    seconds: number;
    color: string;
}

interface ProductivityStats {
    totalSeconds: number;
    billableSeconds: number;
    nonBillableSeconds: number;
    idleSeconds: number;
    projectStats: ProjectStat[];
    dailyStats: Record<string, number>;
}

interface UserStat {
    id: string;
    name: string;
    role: string;
    totalSeconds: number;
    idleSeconds: number;
    lastActive: string | null;
}

const Reports: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<ProductivityStats | null>(null);
    const [teamStats, setTeamStats] = useState<UserStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'PERSONAL' | 'TEAM' | 'USER_DETAIL'>('PERSONAL');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    // Initial Load
    useEffect(() => {
        if (isAdmin) {
            setViewMode('TEAM');
            fetchTeamStats();
        } else {
            fetchStats();
        }
    }, [isAdmin]);

    const fetchStats = async (userId?: string) => {
        setIsLoading(true);
        try {
            const url = userId ? `/time/stats?userId=${userId}` : '/time/stats';
            const response = await api.get(url);
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch productivity stats', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTeamStats = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/time/stats?view=all');
            setTeamStats(response.data.users);
        } catch (error) {
            console.error('Failed to fetch team stats', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserClick = (userId: string) => {
        setSelectedUserId(userId);
        setViewMode('USER_DETAIL');
        fetchStats(userId);
    };

    const handleBackToTeam = () => {
        setSelectedUserId(null);
        setViewMode('TEAM');
        setStats(null);
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Loading reports...</div>;
    }

    // TEAM VIEW (Admin Only)
    if (viewMode === 'TEAM') {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 font-display">Team Activity</h1>
                        <p className="text-gray-500">Overview of all user activities and time logged.</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Idle Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {teamStats.map((stat) => (
                                <tr key={stat.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                    {stat.name.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{stat.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                            {stat.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                        {formatTime(stat.totalSeconds)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600">
                                        {formatTime(stat.idleSeconds)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {stat.lastActive ? new Date(stat.lastActive).toLocaleString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleUserClick(stat.id)}
                                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {teamStats.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                        No active users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // DETAIL / PERSONAL VIEW
    if (!stats) {
        return <div className="p-8 text-center text-gray-500">No data available</div>;
    }

    const billablePercentage = stats.totalSeconds > 0
        ? Math.round((stats.billableSeconds / stats.totalSeconds) * 100)
        : 0;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center space-x-4">
                {viewMode === 'USER_DETAIL' && (
                    <button
                        onClick={handleBackToTeam}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </button>
                )}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-display">
                        {viewMode === 'USER_DETAIL' ? 'User Report' : 'Productivity Reports'}
                    </h1>
                    <p className="text-gray-500">Track your time, billable hours, and project distribution.</p>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Time Tracked</p>
                        <p className="text-2xl font-bold text-gray-900">{formatTime(stats.totalSeconds)}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-green-50 rounded-lg text-green-600">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Billable Hours</p>
                        <p className="text-2xl font-bold text-gray-900">{formatTime(stats.billableSeconds)}</p>
                        <p className="text-xs text-green-600 mt-1">{billablePercentage}% of total time</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-gray-50 rounded-lg text-gray-600">
                        <PieChart className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Non-Billable Hours</p>
                        <p className="text-2xl font-bold text-gray-900">{formatTime(stats.nonBillableSeconds)}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Idle Time</p>
                        <p className="text-2xl font-bold text-gray-900">{formatTime(stats.idleSeconds || 0)}</p>
                    </div>
                </div>
            </div>

            {/* Project Breakdown Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Time by Project</h2>
                    <div className="space-y-4">
                        {stats.projectStats.map((project, index) => {
                            const percentage = stats.totalSeconds > 0
                                ? (project.seconds / stats.totalSeconds) * 100
                                : 0;

                            return (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700">{project.name}</span>
                                        <span className="text-gray-500">{formatTime(project.seconds)} ({Math.round(percentage)}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="h-2.5 rounded-full"
                                            style={{ width: `${percentage}%`, backgroundColor: project.color || '#6366f1' }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                        {stats.projectStats.length === 0 && (
                            <p className="text-center text-gray-400 py-4">No project data available</p>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Insights</h2>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
                        <div className="flex items-start">
                            <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-blue-800 text-sm">Productivity Tip</h4>
                                <p className="text-blue-600 text-sm mt-1">
                                    Try to maintain a billable ratio of above 75% to maximize revenue. You are currently at {billablePercentage}%.
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Placeholder for future charts or more detailed stats */}
                    <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm">
                        More charts coming soon...
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
