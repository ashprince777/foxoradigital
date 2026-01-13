import React, { useEffect, useState } from 'react';
import { X, CheckSquare, Square, Calendar } from 'lucide-react';
import api from '../api/axios';

interface PendingClient {
    client: {
        id: string;
        name: string;
        email: string;
    };
    amount: number;
    taskIds: string[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onGenerated: () => void;
}

const GenerateMonthlyInvoicesModal: React.FC<Props> = ({ isOpen, onClose, onGenerated }) => {
    const [pendingClients, setPendingClients] = useState<PendingClient[]>([]);
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPendingAmounts();
            setSelectedClientIds([]);
        }
    }, [isOpen]);

    const fetchPendingAmounts = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/invoices/pending-amounts');
            setPendingClients(response.data);
        } catch (error) {
            console.error('Failed to fetch pending amounts', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleClient = (clientId: string) => {
        setSelectedClientIds(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };

    const handleGenerate = async () => {
        if (selectedClientIds.length === 0) return;
        setIsGenerating(true);
        try {
            await api.post('/invoices/generate-monthly', { clientIds: selectedClientIds });
            onGenerated();
            onClose();
        } catch (error) {
            console.error('Failed to generate invoices', error);
            alert('Failed to generate invoices');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    const totalSelectedAmount = pendingClients
        .filter(c => selectedClientIds.includes(c.client.id))
        .reduce((sum, c) => sum + c.amount, 0);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center space-x-2">
                            <div className="bg-green-100 p-2 rounded-full">
                                <Calendar className="h-5 w-5 text-green-600" />
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Generate Monthly Invoices</h3>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-4">
                            Select clients to generate invoices for their pending billable tasks.
                        </p>

                        {isLoading ? (
                            <div className="text-center py-4 text-gray-500">Loading pending work...</div>
                        ) : pendingClients.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                                No pending billable work found.
                            </div>
                        ) : (
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {pendingClients.map((item) => {
                                    const isSelected = selectedClientIds.includes(item.client.id);
                                    return (
                                        <div
                                            key={item.client.id}
                                            onClick={() => toggleClient(item.client.id)}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center">
                                                {isSelected ? (
                                                    <CheckSquare className="h-5 w-5 text-indigo-600 mr-3" />
                                                ) : (
                                                    <Square className="h-5 w-5 text-gray-400 mr-3" />
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{item.client.name}</p>
                                                    <p className="text-xs text-gray-500">{item.client.email}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">
                                                ₹{item.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                        <button
                            type="button"
                            disabled={selectedClientIds.length === 0 || isGenerating}
                            onClick={handleGenerate}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:col-start-2 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? 'Generating...' : `Generate (${selectedClientIds.length})`}
                        </button>
                        <button
                            type="button"
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GenerateMonthlyInvoicesModal;
