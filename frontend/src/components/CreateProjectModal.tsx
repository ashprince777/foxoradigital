import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProjectCreated: () => void;
}

interface Client {
    id: string;
    name: string;
}

const createProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().optional(),
    clientId: z.string().uuid('Please select a client'),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED', 'ON_HOLD']).default('ACTIVE'),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onProjectCreated }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateProjectFormValues>({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            status: 'ACTIVE',
        },
    });

    useEffect(() => {
        if (isOpen) {
            fetchClients();
        }
    }, [isOpen]);

    const fetchClients = async () => {
        setIsLoadingClients(true);
        try {
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (err) {
            console.error('Failed to fetch clients', err);
            setError('Failed to load clients. Please try again.');
        } finally {
            setIsLoadingClients(false);
        }
    };

    const onSubmit = async (data: CreateProjectFormValues) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.post('/projects', {
                ...data,
                // Ensure dates are sent in ISO format if they exist
                startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
                dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
            });
            onProjectCreated();
            onClose();
            reset();
        } catch (err: any) {
            console.error('Failed to create project', err);
            setError(err.response?.data?.error || 'Failed to create project.');
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
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Project</h3>
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
                                    Project Name
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
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="client">
                                    Client
                                </label>
                                <select
                                    {...register('clientId')}
                                    id="client"
                                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.clientId ? 'border-red-500' : ''}`}
                                >
                                    <option value="">Select a client</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.clientId && (
                                    <p className="text-red-500 text-xs italic">{errors.clientId.message}</p>
                                )}
                                {clients.length === 0 && !isLoadingClients && (
                                    <p className="text-gray-500 text-xs mt-1">No clients found. Please create a client first.</p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                                    Description
                                </label>
                                <textarea
                                    {...register('description')}
                                    id="description"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
                                        Start Date
                                    </label>
                                    <input
                                        {...register('startDate')}
                                        id="startDate"
                                        type="date"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="dueDate">
                                        Due Date
                                    </label>
                                    <input
                                        {...register('dueDate')}
                                        id="dueDate"
                                        type="date"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
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
                                    {isSubmitting ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateProjectModal;
