import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FolderKanban, Briefcase, Clock, AlertCircle, CheckSquare } from 'lucide-react';
import api from '../api/axios';
import { format } from 'date-fns';

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
}

interface Task {
    id: string;
    title: string;
    dueDate: string;
    priority: string;
}

interface DashboardStats {
    activeProjects: number;
    totalTasks: number;
    overdueTasks: number;
    totalClients: number;
    recentProjects: Project[];
    upcomingDeadlines: Task[];
    totalHoursLogged: number;
}

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/dashboard/stats');
                setStats(response.data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-800';
            case 'COMPLETED': return 'bg-blue-100 text-blue-800';
            case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-8 font-sans pb-10">
            <div className="animate-fade-in-up">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight font-display">Welcome back, {user?.name}</h1>
                <p className="mt-2 text-gray-500 text-lg">Here's what's happening with your projects today.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* Active Projects */}
                <div className="bg-white overflow-hidden shadow-soft hover:shadow-card-hover rounded-xl border border-gray-100 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-indigo-50 rounded-xl p-3">
                                <FolderKanban className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div className="ml-4 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Active Projects</dt>
                                    <dd>
                                        <div className="text-3xl font-bold text-gray-900 mt-2 font-display">
                                            {isLoading ? '-' : stats?.activeProjects}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Tasks */}
                <div className="bg-white overflow-hidden shadow-soft hover:shadow-card-hover rounded-xl border border-gray-100 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-emerald-50 rounded-xl p-3">
                                <Briefcase className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div className="ml-4 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                                    <dd>
                                        <div className="text-3xl font-bold text-gray-900 mt-2 font-display">
                                            {isLoading ? '-' : stats?.totalTasks}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hours Logged */}
                <div className="bg-white overflow-hidden shadow-soft hover:shadow-card-hover rounded-xl border border-gray-100 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <div className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-orange-50 rounded-xl p-3">
                                <Clock className="h-6 w-6 text-orange-600" />
                            </div>
                            <div className="ml-4 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Hours Logged</dt>
                                    <dd>
                                        <div className="text-3xl font-bold text-gray-900 mt-2 font-display">
                                            {isLoading ? '-' : stats?.totalHoursLogged}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overdue Tasks */}
                <div className="bg-white overflow-hidden shadow-soft hover:shadow-card-hover rounded-xl border border-gray-100 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                    <div className="p-6">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-red-50 rounded-xl p-3">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="ml-4 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Overdue Tasks</dt>
                                    <dd>
                                        <div className="text-3xl font-bold text-gray-900 mt-2 font-display">
                                            {isLoading ? '-' : stats?.overdueTasks}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                {/* Recent Projects */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 font-display flex items-center">
                        <span className="bg-indigo-600 w-1.5 h-6 rounded-full mr-3"></span>
                        Recent Projects
                    </h2>
                    <div className="bg-white shadow-card rounded-xl border border-gray-100 overflow-hidden text-left hover:shadow-soft transition-shadow duration-300">
                        <ul className="divide-y divide-gray-50">
                            {stats?.recentProjects.map((project) => (
                                <li key={project.id} className="p-5 hover:bg-gray-50/80 transition-colors group cursor-default">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{project.name}</p>
                                            {project.description && (
                                                <p className="text-xs text-gray-500 truncate mt-1">{project.description}</p>
                                            )}
                                        </div>
                                        <div className="ml-4 flex-shrink-0">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${getStatusColor(project.status)}`}>
                                                {project.status.toLowerCase()}
                                            </span>
                                        </div>
                                    </div>
                                </li>
                            ))}
                            {stats?.recentProjects.length === 0 && (
                                <li className="p-8 text-center text-sm text-gray-500">
                                    <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                                        <FolderKanban className="h-full w-full" />
                                    </div>
                                    No projects found.
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Upcoming Deadlines */}
                <div className="text-left">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 font-display flex items-center">
                        <span className="bg-emerald-500 w-1.5 h-6 rounded-full mr-3"></span>
                        Upcoming Deadlines
                    </h2>
                    {stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0 ? (
                        <div className="bg-white shadow-card rounded-xl border border-gray-100 overflow-hidden hover:shadow-soft transition-shadow duration-300">
                            <ul className="divide-y divide-gray-50">
                                {stats.upcomingDeadlines.map((task) => (
                                    <li key={task.id} className="p-5 hover:bg-gray-50/80 transition-colors group">
                                        <div className="flex items-start">
                                            <div className="flex-shrink-0 mt-1">
                                                <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-50 group-hover:ring-indigo-100 transition-all"></div>
                                            </div>
                                            <div className="ml-4 flex-1">
                                                <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{task.title}</p>
                                                <p className="text-xs text-gray-500 mt-1 font-medium">Due {format(new Date(task.dueDate), 'MMM d, yyyy')}</p>
                                            </div>
                                            <div className="ml-4 flex-shrink-0 text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                                                {task.priority}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="bg-white shadow-card rounded-xl border border-gray-100 p-8 text-center">
                            <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                                <CheckSquare className="h-full w-full" />
                            </div>
                            <p className="text-gray-500 text-sm font-medium">No upcoming tasks</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
