import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Trash2 } from 'lucide-react';
import api from '../api/axios';

interface EditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskUpdated: () => void;
    taskId: string | null;
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

const editTaskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    clientId: z.string().min(1, 'Client is required'),
    assigneeId: z.string().optional(),
    serviceType: z.string().min(1, 'Service Type is required'),
    dueDate: z.string().optional(),
    scheduledDate: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
    isBillable: z.boolean().optional(),
    estimatedHours: z.number().optional(),
});

type EditTaskFormValues = z.infer<typeof editTaskSchema>;

const EditTaskModal: React.FC<EditTaskModalProps> = ({ isOpen, onClose, onTaskUpdated, taskId }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<EditTaskFormValues>({
        resolver: zodResolver(editTaskSchema),
    });

    useEffect(() => {
        if (isOpen && taskId) {
            fetchTaskDetails();
            fetchClients();
            fetchUsers();
        }
    }, [isOpen, taskId]);

    const fetchTaskDetails = async () => {
        if (!taskId) return;
        setIsLoading(true);
        try {
            const response = await api.get(`/tasks/${taskId}`);
            const task = response.data;

            setValue('title', task.title);
            setValue('description', task.description || '');
            setValue('clientId', task.clientId || '');
            setValue('assigneeId', task.assigneeId || '');
            setValue('serviceType', task.serviceType || '');
            setValue('priority', task.priority);
            setValue('status', task.status);
            if (task.dueDate) {
                setValue('dueDate', new Date(task.dueDate).toISOString().split('T')[0]);
            }
            if (task.scheduledDate) {
                setValue('scheduledDate', new Date(task.scheduledDate).toISOString().split('T')[0]);
            }
        } catch (error) {
            console.error('Failed to fetch task details', error);
            setError('Failed to load task details.');
        } finally {
            setIsLoading(false);
        }
    };



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

    const onSubmit = async (data: EditTaskFormValues) => {
        if (!taskId) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await api.put(`/tasks/${taskId}`, {
                ...data,
                assigneeId: data.assigneeId || undefined,
                dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
                scheduledDate: data.scheduledDate ? new Date(data.scheduledDate).toISOString() : undefined,
            });
            onTaskUpdated();
            onClose();
        } catch (err: any) {
            console.error('Failed to update task', err);
            setError(err.response?.data?.error || 'Failed to update task.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!taskId || !window.confirm('Are you sure you want to delete this task?')) return;

        try {
            await api.delete(`/tasks/${taskId}`);
            onTaskUpdated();
            onClose();
        } catch (error) {
            console.error('Failed to delete task', error);
            setError('Failed to delete task.');
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
                            <h3 className="text-xl font-bold text-gray-900">Edit Task</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="text-center py-4">Loading...</div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                                        Task Title *
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
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                                        Description
                                    </label>
                                    <textarea
                                        {...register('description')}
                                        id="description"
                                        placeholder="Enter task description"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        rows={3}
                                    />
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
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
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
                                    <div>
                                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="estimatedHours">
                                            Estimated Hours
                                        </label>
                                        <input
                                            {...register('estimatedHours', { valueAsNumber: true })}
                                            id="estimatedHours"
                                            type="number"
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tags">
                                        Tags
                                    </label>
                                    <input
                                        id="tags"
                                        type="text"
                                        placeholder="design, urgent, client-review (comma separated)"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        disabled
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            {...register('isBillable')}
                                            className="form-checkbox h-5 w-5 text-indigo-600"
                                        />
                                        <span className="ml-2 text-gray-700">Billable task</span>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between border-t pt-4">
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                    </button>
                                    <div className="flex">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isSubmitting ? 'Updating...' : 'Update Task'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditTaskModal;
