import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import api from '../api/axios';

interface CreateClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClientCreated: () => void;
}

const createClientSchema = z.object({
    name: z.string().min(1, 'Client name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    address: z.string().optional(),
    status: z.string().min(1, 'Status is required'),
    brandColor: z.string().optional(),
    portalAccess: z.boolean().optional(),
    plan: z.string().optional(),
    facebookAds: z.boolean().optional(),
    googleAds: z.boolean().optional(),
    facebookAdsPrice: z.coerce.number().optional(),
    googleAdsPrice: z.coerce.number().optional(),
    posterDesignPrice: z.coerce.number().optional(),
    videoEditingPrice: z.coerce.number().optional(),
    aiVideoPrice: z.coerce.number().optional(),
    documentEditingPrice: z.coerce.number().optional(),
    otherWorkPrice: z.coerce.number().optional(),
});

type CreateClientFormValues = z.infer<typeof createClientSchema>;

const CreateClientModal: React.FC<CreateClientModalProps> = ({ isOpen, onClose, onClientCreated }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<CreateClientFormValues>({
        resolver: zodResolver(createClientSchema),
        defaultValues: {
            status: 'Active',
            brandColor: '#3B82F6',
            portalAccess: false,
            facebookAds: false,
            googleAds: false,
        }
    });

    const watchFacebookAds = watch('facebookAds');
    const watchGoogleAds = watch('googleAds');

    const onSubmit = async (data: CreateClientFormValues) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await api.post('/clients', data);
            reset();
            onClientCreated();
            onClose();
        } catch (err: any) {
            console.error('Failed to create client', err);
            setError(err.response?.data?.error || 'Failed to create client.');
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
                            <h3 className="text-xl font-bold text-gray-900">Add New Client</h3>
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
                                    Client Name *
                                </label>
                                <input
                                    {...register('name')}
                                    id="name"
                                    type="text"
                                    className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.name ? 'border-red-500' : ''}`}
                                />
                                {errors.name && <p className="text-red-500 text-xs italic">{errors.name.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                                        Email *
                                    </label>
                                    <input
                                        {...register('email')}
                                        id="email"
                                        type="email"
                                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${errors.email ? 'border-red-500' : ''}`}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs italic">{errors.email.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                                        Phone
                                    </label>
                                    <input
                                        {...register('phone')}
                                        id="phone"
                                        type="text"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                                        Status *
                                    </label>
                                    <select
                                        {...register('status')}
                                        id="status"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="brandColor">
                                        Brand Color
                                    </label>
                                    <input
                                        {...register('brandColor')}
                                        id="brandColor"
                                        type="color"
                                        className="shadow appearance-none border rounded w-full h-10 p-1 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        {...register('portalAccess')}
                                        className="form-checkbox h-4 w-4 text-indigo-600"
                                    />
                                    <span className="ml-2 text-gray-700 text-sm">Enable client portal access</span>
                                </label>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="plan">
                                    Plan
                                </label>
                                <select
                                    {...register('plan')}
                                    id="plan"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                >
                                    <option value="">Select a plan</option>
                                    <option value="Flex Plan – ₹5,000">Flex Plan – ₹5,000</option>
                                    <option value="Starter – ₹7,500">Starter – ₹7,500</option>
                                    <option value="Business Growth – ₹15,000">Business Growth – ₹15,000</option>
                                    <option value="Scale Plan – ₹25,000">Scale Plan – ₹25,000</option>
                                    <option value="Pro Performance – ₹45,000">Pro Performance – ₹45,000</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Social Media Ads
                                </label>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                {...register('facebookAds')}
                                                className="form-checkbox h-4 w-4 text-indigo-600"
                                            />
                                            <span className="ml-2 text-gray-700 text-sm">Facebook Ads</span>
                                        </label>
                                        {watchFacebookAds && (
                                            <div className="relative w-32">
                                                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 text-xs">₹</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    placeholder="Amount"
                                                    {...register('facebookAdsPrice')}
                                                    className="shadow appearance-none border rounded w-full py-1 pl-6 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:shadow-outline"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                {...register('googleAds')}
                                                className="form-checkbox h-4 w-4 text-indigo-600"
                                            />
                                            <span className="ml-2 text-gray-700 text-sm">Google Ads</span>
                                        </label>
                                        {watchGoogleAds && (
                                            <div className="relative w-32">
                                                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 text-xs">₹</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    placeholder="Amount"
                                                    {...register('googleAdsPrice')}
                                                    className="shadow appearance-none border rounded w-full py-1 pl-6 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:shadow-outline"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 mb-4">
                                <h4 className="flex items-center text-lg font-semibold text-gray-700 mb-2">
                                    <span className="text-green-500 mr-2">$</span> Service Pricing
                                </h4>
                                <p className="text-gray-500 text-xs mb-4">Set custom pricing for this client based on their affordability</p>

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Poster Design', name: 'posterDesignPrice' },
                                        { label: 'Video Editing', name: 'videoEditingPrice' },
                                        { label: 'AI Video', name: 'aiVideoPrice' },
                                        { label: 'Document Editing', name: 'documentEditingPrice' },
                                        { label: 'Other Work', name: 'otherWorkPrice' },
                                    ].map((field) => (
                                        <div key={field.name} className="mb-2">
                                            <label className="block text-gray-700 text-xs font-bold mb-1">
                                                {field.label}
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <span className="text-gray-500 sm:text-sm">₹</span>
                                                </div>
                                                <input
                                                    {...register(field.name as any)}
                                                    type="number"
                                                    className="shadow appearance-none border rounded w-full py-2 pl-7 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                                />
                                            </div>
                                        </div>
                                    ))}
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
                                    {isSubmitting ? 'Create Client' : 'Create Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateClientModal;
