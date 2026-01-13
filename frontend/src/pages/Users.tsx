import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import CreateUserModal from '../components/CreateUserModal';
import ResetPasswordModal from '../components/ResetPasswordModal';
import { format } from 'date-fns';
import { Edit2, Save, X as XIcon, Lock, Check, Plus, Trash2, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    hourlyRate?: number;
    capacity?: number;
    status?: string;
    allowedMenus?: string;
}

const ALL_MENUS = [
    'Dashboard',
    'Projects',
    'Tasks',
    'Content Calendar',
    'Client List',
    'Payment Details',
    'Client Portal',
    'Invoices',
    'User Management',
    'Settings'
];

const Users: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Reset Password State
    const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);

    // Edit State
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{
        role: string;
        hourlyRate: number;
        capacity: number;
        status: string;
        allowedMenus: string[];
    }>({
        role: '',
        hourlyRate: 0,
        capacity: 0,
        status: '',
        allowedMenus: []
    });

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEditClick = (user: User) => {
        let menus: string[] = [];
        try {
            if (user.allowedMenus) {
                menus = JSON.parse(user.allowedMenus);
            } else {
                menus = ALL_MENUS; // Default to all if not set
            }
        } catch (e) {
            menus = ALL_MENUS;
        }

        setEditingUserId(user.id);
        setEditForm({
            role: user.role,
            hourlyRate: user.hourlyRate || 0,
            capacity: user.capacity || 40,
            status: user.status || 'Active',
            allowedMenus: menus
        });
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
    };

    const handleSaveEdit = async () => {
        if (!editingUserId) return;
        try {
            await api.put(`/users/${editingUserId}`, editForm);
            setEditingUserId(null);
            fetchUsers();
        } catch (error) {
            console.error('Failed to update user', error);
            alert('Failed to update user');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        try {
            await api.delete(`/users/${userId}`);
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user', error);
            alert('Failed to delete user');
        }
    };

    const handleUserCreated = () => {
        fetchUsers();
    };

    const toggleMenuPermission = (menu: string) => {
        if (!editingUserId) return;
        setEditForm(prev => ({
            ...prev,
            allowedMenus: prev.allowedMenus.includes(menu)
                ? prev.allowedMenus.filter(m => m !== menu)
                : [...prev.allowedMenus, menu]
        }));
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-800';
            case 'ADMIN': return 'bg-red-100 text-red-800';
            case 'PROJECT_MANAGER': return 'bg-blue-100 text-blue-800';
            case 'CONTENT_CREATOR': return 'bg-green-100 text-green-800';
            case 'CREATOR': return 'bg-green-100 text-green-800';
            case 'DESIGNER': return 'bg-pink-100 text-pink-800';
            case 'DEVELOPER': return 'bg-indigo-100 text-indigo-800';
            case 'CLIENT': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusStyle = (status: string) => {
        return status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
    };

    if (isLoading) return <div>Loading users...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage user roles and permissions</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-gray-500 text-sm mr-2">
                        <span className="font-medium text-gray-900">{users.length}</span> users
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                    </button>
                </div>
            </div>

            <div className="bg-white shadow border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hourly Rate</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity (Hrs/Week)</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => {
                            const isEditing = editingUserId === user.id;

                            return (
                                <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${isEditing ? 'bg-blue-50/50' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                                <div className="text-xs text-gray-500">Joined {format(new Date(user.createdAt), 'MM/dd/yyyy')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isEditing ? (
                                            <select
                                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                                value={editForm.role}
                                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                            >
                                                <option value="SUPER_ADMIN">Super Admin</option>
                                                <option value="ADMIN">Admin</option>
                                                <option value="PROJECT_MANAGER">Project Manager</option>
                                                <option value="CONTENT_CREATOR">Content Creator</option>
                                                <option value="CLIENT">Client</option>
                                            </select>
                                        ) : (
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                                {user.role.replace('_', ' ')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-24 sm:text-sm border-gray-300 rounded-md"
                                                value={editForm.hourlyRate}
                                                onChange={(e) => setEditForm({ ...editForm, hourlyRate: parseFloat(e.target.value) })}
                                            />
                                        ) : (
                                            `₹${user.hourlyRate || 0}/hr`
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-20 sm:text-sm border-gray-300 rounded-md"
                                                value={editForm.capacity}
                                                onChange={(e) => setEditForm({ ...editForm, capacity: parseInt(e.target.value) })}
                                            />
                                        ) : (
                                            `${user.capacity || 40} hrs`
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isEditing ? (
                                            <select
                                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                                value={editForm.status}
                                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        ) : (
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyle(user.status || 'Active')}`}>
                                                {user.status || 'Active'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-900 border border-green-200 rounded p-1 bg-green-50">
                                                        <Save className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={handleCancelEdit} className="text-red-600 hover:text-red-900 border border-red-200 rounded p-1 bg-red-50">
                                                        <XIcon className="h-4 w-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleEditClick(user)} className="text-indigo-600 hover:text-indigo-900">
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    {currentUser?.role === 'SUPER_ADMIN' && (
                                                        <>
                                                            <button
                                                                onClick={() => setResetPasswordUser(user)}
                                                                className="text-orange-600 hover:text-orange-900 ml-2"
                                                                title="Reset Password"
                                                            >
                                                                <Key className="h-4 w-4" />
                                                            </button>
                                                            {user.id !== currentUser.id && (
                                                                <button
                                                                    onClick={() => handleDeleteUser(user.id)}
                                                                    className="text-red-600 hover:text-red-900 ml-2"
                                                                    title="Delete User"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Permission Levels Legend */}
                <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">Permission Levels</h3>
                    <div className="space-y-3">
                        <div className="flex items-center text-sm">
                            <span className="w-32 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold mr-3 text-center">Super Admin</span>
                            <span className="text-blue-800 font-medium whitespace-nowrap">- Full system access</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <span className="w-32 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold mr-3 text-center">Admin</span>
                            <span className="text-blue-800 font-medium whitespace-nowrap">- Manage users and settings</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <span className="w-32 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold mr-3 text-center">Project Manager</span>
                            <span className="text-blue-800 font-medium whitespace-nowrap">- Manage projects and clients</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <span className="w-32 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold mr-3 text-center">Content Creator</span>
                            <span className="text-blue-800 font-medium whitespace-nowrap">- Create and manage content</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <span className="w-32 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold mr-3 text-center">Client</span>
                            <span className="text-blue-800 font-medium whitespace-nowrap">- View only access</span>
                        </div>
                    </div>
                </div>

                {/* Permission Access Panel */}
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Permission Access</h3>
                    {editingUserId ? (
                        <div className="bg-gray-50 rounded-lg p-4 custom-scrollbar max-h-60 overflow-y-auto">
                            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-bold">
                                Menu Access for {users.find(u => u.id === editingUserId)?.name}
                            </p>
                            <div className="space-y-2">
                                {ALL_MENUS.map(menu => (
                                    <label key={menu} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors">
                                        <div className={`
                                            w-5 h-5 rounded border flex items-center justify-center transition-colors
                                            ${editForm.allowedMenus.includes(menu)
                                                ? 'bg-green-500 border-green-500'
                                                : 'bg-white border-gray-300'}
                                        `}>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={editForm.allowedMenus.includes(menu)}
                                                onChange={() => toggleMenuPermission(menu)}
                                            />
                                            {editForm.allowedMenus.includes(menu) && (
                                                <Check className="h-3 w-3 text-white" />
                                            )}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700">{menu}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 border-2 border-dashed border-gray-100 rounded-lg">
                            <Lock className="h-10 w-10 mb-2 opacity-50" />
                            <p className="text-sm">Select a user's edit button to configure permissions</p>
                        </div>
                    )}
                </div>
            </div>

            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onUserCreated={handleUserCreated}
            />

            <ResetPasswordModal
                isOpen={!!resetPasswordUser}
                onClose={() => setResetPasswordUser(null)}
                userId={resetPasswordUser?.id || null}
                userName={resetPasswordUser?.name || 'User'}
            />
        </div>
    );
};

export default Users;
