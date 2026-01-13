import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import api from '../api/axios';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserCreated: () => void;
}

const createUserSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER', 'CREATOR', 'CLIENT']),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateUserFormValues>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            role: 'CREATOR',
        },
    });

    const onSubmit = async (data: CreateUserFormValues) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.post('/users', data);
            onUserCreated();
            onClose();
            reset();
        } catch (err: any) {
            console.error('Failed to create user', err);
            setError(
                typeof err.response?.data?.error === 'string'
                    ? err.response.data.error
                    : JSON.stringify(err.response?.data?.error) || 'Failed to create user.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                    &#8203;
                </span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Add New User</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                                    Name
                                </label>
                                <input
                                    {...register('name')}
                                    id="name"
                                    type="text"
                                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.name ? 'border-red-500' : ''}`}
                                />
                                {errors.name && <p className="text-red-500 text-xs italic">{errors.name.message}</p>}
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    {...register('email')}
                                    id="email"
                                    type="email"
                                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.email ? 'border-red-500' : ''}`}
                                />
                                {errors.email && <p className="text-red-500 text-xs italic">{errors.email.message}</p>}
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    {...register('password')}
                                    id="password"
                                    type="password"
                                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.password ? 'border-red-500' : ''}`}
                                />
                                {errors.password && <p className="text-red-500 text-xs italic">{errors.password.message}</p>}
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                                    Role
                                </label>
                                <select
                                    {...register('role')}
                                    id="role"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                >
                                    <option value="CREATOR">Creator</option>
                                    <option value="PROJECT_MANAGER">Project Manager</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                    <option value="CLIENT">Client Account</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? 'Create User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateUserModal;
