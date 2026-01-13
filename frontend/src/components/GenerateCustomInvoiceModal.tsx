import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, FileText } from 'lucide-react';
import api from '../api/axios';

const schema = z.object({
    clientId: z.string().min(1, 'Client is required'),
    fromDate: z.string().min(1, 'From Date is required'),
    toDate: z.string().min(1, 'To Date is required'),
});

type FormData = z.infer<typeof schema>;

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onGenerated: () => void;
}

const GenerateCustomInvoiceModal: React.FC<Props> = ({ isOpen, onClose, onGenerated }) => {
    const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
        resolver: zodResolver(schema)
    });

    useEffect(() => {
        if (isOpen) {
            fetchClients();
            reset();
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

    const onSubmit = async (data: FormData) => {
        try {
            await api.post('/invoices/generate-custom', data);
            onGenerated();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Failed to generate invoice');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center space-x-2">
                            {/* Removed icon to match screenshot simpler style, or keep it consistent? Screenshot has simple text header */}
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Generate Custom Invoice</h3>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">Client</label>
                            <select
                                {...register('clientId')}
                                id="clientId"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                            >
                                <option value="">Select a client</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                    </option>
                                ))}
                            </select>
                            {errors.clientId && <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700">From Date</label>
                            <input
                                {...register('fromDate')}
                                type="date"
                                id="fromDate"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            {errors.fromDate && <p className="mt-1 text-sm text-red-600">{errors.fromDate.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="toDate" className="block text-sm font-medium text-gray-700">To Date</label>
                            <input
                                {...register('toDate')}
                                type="date"
                                id="toDate"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            {errors.toDate && <p className="mt-1 text-sm text-red-600">{errors.toDate.message}</p>}
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                            >
                                {isSubmitting ? 'Generating...' : 'Generate'}
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GenerateCustomInvoiceModal;
