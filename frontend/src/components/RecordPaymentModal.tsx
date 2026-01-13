import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, CreditCard } from 'lucide-react';
import api from '../api/axios';

const schema = z.object({
    amount: z.number().min(1, 'Amount must be greater than 0'),
    paymentDate: z.string().min(1, 'Date is required'),
    paymentMethod: z.string().min(1, 'Method is required'),
    transactionId: z.string().optional(),
    notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ClientStat {
    id: string;
    name: string;
    pendingAmount: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    client: ClientStat | null;
}

const RecordPaymentModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, client }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, reset } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'Bank Transfer'
        }
    });

    useEffect(() => {
        if (isOpen && client) {
            reset({
                amount: client.pendingAmount > 0 ? client.pendingAmount : undefined,
                paymentDate: new Date().toISOString().split('T')[0],
                paymentMethod: 'Bank Transfer',
                transactionId: '',
                notes: ''
            });
        }
    }, [isOpen, client, reset]);

    const onSubmit = async (data: FormData) => {
        if (!client) return;
        try {
            await api.post('/invoices/payment', {
                clientId: client.id,
                ...data
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to record payment', error);
            alert('Failed to record payment');
        }
    };

    if (!isOpen || !client) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">Record Payment</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Client Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center">
                        <CreditCard className="h-5 w-5 text-blue-500 mr-3" />
                        <div>
                            <p className="text-sm font-semibold text-blue-900">{client.name}</p>
                            <p className="text-sm text-blue-700">Pending Amount: <span className="font-bold">₹{client.pendingAmount.toLocaleString()}</span></p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Payment Amount *</label>
                            <input
                                {...register('amount', { valueAsNumber: true })}
                                type="number"
                                step="0.01"
                                placeholder="Enter amount"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Payment Date *</label>
                            <input
                                {...register('paymentDate')}
                                type="date"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                            {errors.paymentDate && <p className="mt-1 text-sm text-red-600">{errors.paymentDate.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Payment Method *</label>
                            <select
                                {...register('paymentMethod')}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                                <option value="UPI">UPI</option>
                                <option value="Card">Card</option>
                                <option value="Other">Other</option>
                            </select>
                            {errors.paymentMethod && <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                            <input
                                {...register('transactionId')}
                                type="text"
                                placeholder="Enter transaction reference"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                            <textarea
                                {...register('notes')}
                                rows={3}
                                placeholder="Add any notes"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                            >
                                {isSubmitting ? 'Recording...' : 'Record Payment'}
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
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

export default RecordPaymentModal;
