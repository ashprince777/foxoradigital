import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import api from '../api/axios';

interface Client {
    id: string;
    name: string;
}

interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

const NewInvoiceModal: React.FC<Props> = ({ isOpen, onClose, onCreated }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [clientId, setClientId] = useState('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [dueDate, setDueDate] = useState('');
    const [status, setStatus] = useState('DRAFT');
    const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
    const [taxRate, setTaxRate] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchClients();
            // Reset form
            setClientId('');
            setDueDate(''); // Or calculate default
            setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
            setTaxRate(0);
            setDiscount(0);
            setNotes('');
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

    const handleAddItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount - discount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/invoices', {
                clientId,
                dueDate: new Date(dueDate).toISOString(),
                status,
                items,
                taxRate,
                discount,
                notes
            });
            onCreated();
            onClose();
        } catch (error) {
            console.error('Failed to create invoice', error);
            alert('Failed to create invoice');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-xl font-bold text-gray-900" id="modal-title">New Invoice</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Header Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Client *</label>
                                <select
                                    required
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    <option value="">Select a client</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-50"
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Due Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                <option value="DRAFT">Draft</option>
                                <option value="SENT">Sent</option>
                                <option value="PAID">Paid</option>
                            </select>
                        </div>

                        {/* Line Items */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-lg font-medium text-gray-900">Line Items</h4>
                                <button type="button" onClick={handleAddItem} className="text-sm text-indigo-600 hover:text-indigo-900 flex items-center">
                                    <Plus className="h-4 w-4 mr-1" /> Add Item
                                </button>
                            </div>
                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <input
                                            type="text"
                                            placeholder="Description"
                                            required
                                            value={item.description}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            className="flex-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Qty"
                                            required
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                            className="w-20 block shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={item.unitPrice}
                                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                                            className="w-32 block shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                        <div className="w-24 text-right font-medium">₹{(item.quantity * item.unitPrice).toFixed(2)}</div>
                                        <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer (Totals) */}
                        <div className="border-t pt-4 flex justify-end">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal:</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <span>Tax (%):</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={taxRate}
                                        onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                                        className="w-16 p-1 text-right border-gray-300 rounded-md shadow-sm sm:text-sm"
                                    />
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <span>Discount:</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={discount}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value))}
                                        className="w-24 p-1 text-right border-gray-300 rounded-md shadow-sm sm:text-sm"
                                    />
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                                    <span>Total:</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                            <textarea
                                className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                rows={3}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Additional notes or payment terms..."
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Invoice'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewInvoiceModal;
