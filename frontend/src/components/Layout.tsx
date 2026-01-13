import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    Calendar,
    Users,
    Settings,
    LogOut,
    CreditCard,
    FileText,
    Globe,
    PieChart
} from 'lucide-react';
import TimeTrackerWidget from './TimeTrackerWidget';

import { cn } from '../utils/cn';

const Layout: React.FC = () => {
    const { logout, user } = useAuth();
    const location = useLocation();

    const navigation = [
        {
            category: 'MAIN',
            items: [
                { name: 'Dashboard', href: '/', icon: LayoutDashboard },
                { name: 'Projects', href: '/projects', icon: FolderKanban },
                { name: 'Tasks', href: '/tasks', icon: CheckSquare },
                { name: 'Time Tracker', href: '/reports', icon: PieChart },
                { name: 'Content Calendar', href: '/calendar', icon: Calendar },
            ]
        },
        {
            category: 'BUSINESS',
            items: [
                { name: 'Client List', href: '/clients', icon: Users },
                { name: 'Payment Details', href: '/payment', icon: CreditCard },
                { name: 'Client Portal', href: '/client/dashboard', icon: Globe },
                { name: 'Invoices', href: '/invoices', icon: FileText },
            ]
        },
        {
            category: 'ADMINISTRATION',
            items: [
                { name: 'User Management', href: '/users', icon: Users },
                { name: 'Settings', href: '/settings', icon: Settings },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white/80 backdrop-blur-xl border-r border-gray-100 flex flex-col fixed inset-y-0 z-10 transition-all duration-300">
                <div className="flex items-center justify-center h-20 border-b border-gray-50">
                    <img src="/foxora-logo.png" alt="Foxora" className="h-14 w-auto object-contain" />
                </div>

                <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4 custom-scrollbar">
                    <nav className="mt-5 flex-1 px-4 space-y-8">
                        {navigation.map((group) => {
                            // Hide BUSINESS and ADMINISTRATION for CREATOR role
                            if (user?.role === 'CREATOR' && (group.category === 'BUSINESS' || group.category === 'ADMINISTRATION')) {
                                return null;
                            }

                            const filteredItems = group.items.filter(item => {
                                // Only show Time Tracker to ADMIN/SUPER_ADMIN
                                if (item.name === 'Time Tracker') {
                                    return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
                                }

                                // SUPER_ADMIN gets access to everything
                                if (user?.role === 'SUPER_ADMIN') return true;

                                if (!user?.allowedMenus) return true;
                                try {
                                    const allowed = JSON.parse(user.allowedMenus);
                                    return Array.isArray(allowed) ? allowed.includes(item.name) : true;
                                } catch (e) {
                                    return true;
                                }
                            });

                            if (filteredItems.length === 0) return null;

                            return (
                                <div key={group.category} className="animate-fade-in">
                                    <h3 className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                                        {group.category}
                                    </h3>
                                    <div className="space-y-1">
                                        {filteredItems.map((item) => {
                                            const isActive = location.pathname === item.href;
                                            return (
                                                <Link
                                                    key={item.name}
                                                    to={item.href}
                                                    className={cn(
                                                        isActive
                                                            ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                                        'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out'
                                                    )}
                                                >
                                                    <item.icon
                                                        className={cn(
                                                            isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500',
                                                            'mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200'
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                    {item.name}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </nav>
                </div>
                <div className="border-t border-gray-50 p-4">
                    <div className="flex items-center group cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex-shrink-0">
                            <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm ring-2 ring-white">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        </div>
                        <div className="ml-3 flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate transition-colors">{user?.name}</p>
                            <p className="text-xs text-gray-500 capitalize truncate">{user?.role?.replace('_', ' ').toLowerCase()}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col pl-64 transition-all duration-300">
                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Time Tracker Widget */}
            <TimeTrackerWidget key={user?.id || 'guest'} />
        </div>
    );
};

export default Layout;
