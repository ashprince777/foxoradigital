import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import api from '../api/axios';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskCreated: () => void;
}

interface Client {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string;
    role: string;
}

const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    clientId: z.string().min(1, 'Client is required'),
    assigneeId: z.string().optional(),
    serviceType: z.string().min(1, 'Service Type is required'),
    dueDate: z.string().optional(),
    scheduledDate: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose, onTaskCreated }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateTaskFormValues>({
        resolver: zodResolver(createTaskSchema),
        defaultValues: {
            priority: 'MEDIUM',
            status: 'TODO',
        },
    });

    useEffect(() => {
        if (isOpen) {
            fetchClients();
            fetchUsers();
            setSelectedClientId('');
        }
    }, [isOpen]);



    const fetchClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (error) {
            console.error('Failed to fetch clients', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            // Filter out clients from assignee list
            const assignableUsers = response.data.filter((user: User) => user.role !== 'CLIENT');
            setUsers(assignableUsers);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    const onSubmit = async (data: CreateTaskFormValues) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.post('/tasks', {
                ...data,
                assigneeId: data.assigneeId || undefined,
                dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
                scheduledDate: data.scheduledDate ? new Date(data.scheduledDate).toISOString() : undefined,
            });
            onTaskCreated();
            onClose();
            reset();
        } catch (err: any) {
            console.error('Failed to create task', err);
            setError(err.response?.data?.error || 'Failed to create task.');
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
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Task</h3>
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
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                                    Title
                                </label>
                                <input
                                    {...register('title')}
                                    id="title"
                                    type="text"
                                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.title ? 'border-red-500' : ''}`}
                                />
                                {errors.title && <p className="text-red-500 text-xs italic">{errors.title.message}</p>}
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clientId">
                                    Client *
                                </label>
                                <select
                                    {...register('clientId')}
                                    id="clientId"
                                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.clientId ? 'border-red-500' : ''}`}
                                >
                                    <option value="">Select a client</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.clientId && <p className="text-red-500 text-xs italic">{errors.clientId.message}</p>}
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="serviceType">
                                    Service Type *
                                </label>
                                <select
                                    {...register('serviceType')}
                                    id="serviceType"
                                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.serviceType ? 'border-red-500' : ''}`}
                                >
                                    <option value="">Select service type</option>
                                    <option value="Poster Design">Poster Design</option>
                                    <option value="Video Editing">Video Editing</option>
                                    <option value="AI Video">AI Video</option>
                                    <option value="Document Editing">Document Editing</option>
                                    <option value="Other Work">Other Work</option>
                                </select>
                                {errors.serviceType && (
                                    <p className="text-red-500 text-xs italic">{errors.serviceType.message}</p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="assigneeId">
                                    Assignee
                                </label>
                                <select
                                    {...register('assigneeId')}
                                    id="assigneeId"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                >
                                    <option value="">Unassigned</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
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
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                                        Status
                                    </label>
                                    <select
                                        {...register('status')}
                                        id="status"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    >
                                        <option value="TODO">To Do</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="REVIEW">Review</option>
                                        <option value="DONE">Done</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="priority">
                                        Priority
                                    </label>
                                    <select
                                        {...register('priority')}
                                        id="priority"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
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
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="scheduledDate">
                                        Scheduled Date
                                    </label>
                                    <input
                                        {...register('scheduledDate')}
                                        id="scheduledDate"
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
                                    {isSubmitting ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateTaskModal;
