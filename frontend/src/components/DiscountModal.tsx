import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../api/axios';

interface DiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    client: {
        id: string;
        name: string;
        pendingAmount: number;
    } | null;
}

const DiscountModal: React.FC<DiscountModalProps> = ({ isOpen, onClose, onSuccess, client }) => {
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !client) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/invoices/discount', {
                clientId: client.id,
                amount: parseFloat(amount)
            });
            onSuccess();
            onClose();
            setAmount('');
        } catch (error) {
            console.error(error);
            alert('Failed to apply discount');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Apply Discount</h2>
                    <button onClick={onClose}><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Client</label>
                        <input type="text" value={client.name} disabled className="w-full p-2 border rounded bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Pending Amount (Unbilled)</label>
                        <input type="text" value={`₹${client.pendingAmount.toLocaleString()}`} disabled className="w-full p-2 border rounded bg-gray-50" />
                        <p className="text-xs text-gray-500 mt-1">Note: Discounts are applied to unbilled tasks.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Discount Amount</label>
                        <input
                            type="number"
                            required
                            min="1"
                            step="0.01"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Applying...' : 'Apply Discount'}
                    </button>
                    <p className="text-xs text-red-500">Warning: This action permanently marks tasks as discounted/archived.</p>
                </form>
            </div>
        </div>
    );
};

export default DiscountModal;
