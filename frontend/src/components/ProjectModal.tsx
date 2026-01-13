import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';

interface Project {
    id: string;
    name: string;
    description?: string;
    status: string;
    clientId: string;
    priority?: string;
    billingType?: string;
    budget?: number;
    startDate?: string;
    dueDate?: string;
}

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProjectSaved: () => void;
    projectToEdit?: Project | null;
}

interface Client {
    id: string;
    name: string;
}

const projectSchema = z.object({
    name: z.string().min(1, 'Project name is required'),
    description: z.string().optional(),
    clientId: z.string().uuid('Please select a client'),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED', 'ON_HOLD']).default('PLANNING'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    billingType: z.enum(['HOURLY', 'FIXED']).default('HOURLY'),
    budget: z.coerce.number().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onProjectSaved, projectToEdit }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            status: 'PLANNING',
            priority: 'MEDIUM',
            billingType: 'HOURLY',
        },
    });

    useEffect(() => {
        if (isOpen) {
            fetchClients();
            if (projectToEdit) {
                // Populate form for editing
                setValue('name', projectToEdit.name);
                setValue('description', projectToEdit.description || '');
                setValue('clientId', projectToEdit.clientId);
                setValue('status', projectToEdit.status as any);
                setValue('priority', (projectToEdit.priority || 'MEDIUM') as any);
                setValue('billingType', (projectToEdit.billingType || 'HOURLY') as any);
                setValue('budget', projectToEdit.budget);

                // Format dates for input type="date"
                if (projectToEdit.startDate) {
                    setValue('startDate', new Date(projectToEdit.startDate).toISOString().split('T')[0]);
                }
                if (projectToEdit.dueDate) {
                    setValue('dueDate', new Date(projectToEdit.dueDate).toISOString().split('T')[0]);
                }
            } else {
                reset({
                    status: 'PLANNING',
                    priority: 'MEDIUM',
                    billingType: 'HOURLY',
                    name: '',
                    description: '',
                    clientId: '',
                });
            }
        }
    }, [isOpen, projectToEdit, reset, setValue]);

    const fetchClients = async () => {
        setIsLoadingClients(true);
        try {
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (err) {
            console.error('Failed to fetch clients', err);
            setError('Failed to load clients.');
        } finally {
            setIsLoadingClients(false);
        }
    };

    const onSubmit = async (data: ProjectFormValues) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const payload = {
                ...data,
                startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
                dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
            };

            if (projectToEdit) {
                await api.put(`/projects/${projectToEdit.id}`, payload);
            } else {
                await api.post('/projects', payload);
            }

            onProjectSaved();
            onClose();
        } catch (err: any) {
            console.error('Failed to save project', err);
            setError(err.response?.data?.error || 'Failed to save project.');
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
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-8 py-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 font-display">
                                {projectToEdit ? 'Edit Project' : 'New Project'}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Project Name</label>
                                <input
                                    {...register('name')}
                                    placeholder="Enter project name"
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                                <textarea
                                    {...register('description')}
                                    placeholder="Enter project description"
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Client</label>
                                    <select
                                        {...register('clientId')}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white ${errors.clientId ? 'border-red-500' : 'border-gray-200'}`}
                                    >
                                        <option value="">Select Client</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    {errors.clientId && <p className="text-red-500 text-xs mt-1">{errors.clientId.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Status</label>
                                    <select
                                        {...register('status')}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                                    >
                                        <option value="PLANNING">Planning</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="ON_HOLD">On Hold</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="ARCHIVED">Archived</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Priority</label>
                                    <select
                                        {...register('priority')}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Billing Type</label>
                                    <select
                                        {...register('billingType')}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                                    >
                                        <option value="HOURLY">Hourly</option>
                                        <option value="FIXED">Fixed Price</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        {...register('startDate')}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2">End Date</label>
                                    <input
                                        type="date"
                                        {...register('dueDate')}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Budget</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('budget')}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end mt-8 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-gray-700 font-medium px-4 py-2 mr-2 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg shadow-sm hover:shadow-md transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectModal;
