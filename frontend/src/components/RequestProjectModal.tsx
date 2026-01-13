import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../api/axios';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onRequestSent: () => void;
}

const RequestProjectModal: React.FC<Props> = ({ isOpen, onClose, onRequestSent }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [type, setType] = useState('Web Development');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const finalDescription = `[Type: ${type}]\n\n${description}`;

            await api.post('/projects', {
                name: `[REQUEST] ${name}`,
                description: finalDescription,
                budget: budget ? parseFloat(budget) : undefined,
                status: 'ON_HOLD'
            });

            onRequestSent();
            onClose();
            setName('');
            setDescription('');
            setBudget('');
        } catch (error) {
            console.error('Failed to request project', error);
            alert('Failed to submit request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Request New Project</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Project Name</label>
                            <input
                                type="text"
                                id="name"
                                required
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Website Rebrand 2024"
                            />
                        </div>

                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Project Type</label>
                            <select
                                id="type"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option>Web Development</option>
                                <option>Mobile App</option>
                                <option>Design / Branding</option>
                                <option>Marketing Campaign</option>
                                <option>Content Creation</option>
                                <option>Other</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="budget" className="block text-sm font-medium text-gray-700">Estimated Budget (Optional)</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">₹</span>
                                </div>
                                <input
                                    type="number"
                                    id="budget"
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
                                    placeholder="0.00"
                                    value={budget}
                                    onChange={(e) => setBudget(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description / Requirements</label>
                            <textarea
                                id="description"
                                rows={4}
                                required
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe what you need..."
                            />
                        </div>

                        <div className="mt-5 sm:mt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                            >
                                {isSubmitting ? 'Sending Request...' : 'Submit Request'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RequestProjectModal;
