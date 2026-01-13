import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    FolderKanban,
    FileText,
    LogOut,
    LifeBuoy
} from 'lucide-react';
import { cn } from '../utils/cn';

const ClientLayout: React.FC = () => {
    const { logout, user } = useAuth();
    const location = useLocation();

    // Client-specific navigation
    const navigation = [
        {
            category: 'PORTAL',
            items: [
                { name: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
                { name: 'My Projects', href: '/projects', icon: FolderKanban }, // Reusing existing projects page, backend now filters it
                { name: 'Invoices', href: '/invoices', icon: FileText },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white/80 backdrop-blur-xl border-r border-gray-100 flex flex-col fixed inset-y-0 z-10 transition-all duration-300">
                <div className="flex items-center h-16 px-6 border-b border-gray-50">
                    <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-1.5 rounded-lg shadow-sm mr-3">
                        <LifeBuoy className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-900 tracking-tight font-display">Client Portal</span>
                </div>

                <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4 custom-scrollbar">
                    <nav className="mt-5 flex-1 px-4 space-y-8">
                        {navigation.map((group) => {
                            const filteredItems = group.items.filter(item => {
                                if (!user?.allowedMenus) return true;
                                try {
                                    const allowed = JSON.parse(user.allowedMenus);
                                    if (!Array.isArray(allowed)) return true;

                                    // Map Client Portal specific names to permission keys
                                    let permissionKey = item.name;
                                    if (item.name === 'My Projects') permissionKey = 'Projects';

                                    // Dashboard is usually always allowed, or check if 'Client Portal' covers it
                                    // But typically dashboard is basic access. 
                                    // If we want to be strict: 
                                    // if (item.name === 'Dashboard') return allowed.includes('Client Portal') || allowed.includes('Dashboard');

                                    return allowed.includes(permissionKey);
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
                            <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shadow-sm ring-2 ring-white">
                                {user?.name?.charAt(0) || 'C'}
                            </div>
                        </div>
                        <div className="ml-3 flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate transition-colors">{user?.name}</p>
                            <p className="text-xs text-gray-500 capitalize truncate">Client Account</p>
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
        </div>
    );
};

export default ClientLayout;
