import React from 'react';
import { X, Copy } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    invoiceAmount?: number;
}

const PaymentInstructionsModal: React.FC<Props> = ({ isOpen, onClose, invoiceAmount }) => {
    if (!isOpen) return null;

    const bankDetails = {
        name: "Foxora Agency",
        bank: "HDFC Bank",
        accountNumber: "50200012345678",
        ifsc: "HDFC0001234",
        upi: "foxora@hdfcbank"
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Simple feedback could be added
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Payment Details</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                        <p className="text-sm text-blue-700">
                            Please transfer <strong>₹{invoiceAmount?.toLocaleString() || 'the pending amount'}</strong> to the following account.
                            Your invoice will be marked as paid once the transaction is verified.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Bank Transfer</h4>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100">
                                    <span className="text-sm text-gray-500">Account Name</span>
                                    <div className="flex items-center">
                                        <span className="text-sm font-medium text-gray-900 mr-2">{bankDetails.name}</span>
                                        <button onClick={() => copyToClipboard(bankDetails.name)} className="text-gray-400 hover:text-gray-600"><Copy className="h-3 w-3" /></button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100">
                                    <span className="text-sm text-gray-500">Bank</span>
                                    <span className="text-sm font-medium text-gray-900">{bankDetails.bank}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100">
                                    <span className="text-sm text-gray-500">Account Number</span>
                                    <div className="flex items-center">
                                        <span className="text-sm font-medium text-gray-900 mr-2">{bankDetails.accountNumber}</span>
                                        <button onClick={() => copyToClipboard(bankDetails.accountNumber)} className="text-gray-400 hover:text-gray-600"><Copy className="h-3 w-3" /></button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100">
                                    <span className="text-sm text-gray-500">IFSC Code</span>
                                    <div className="flex items-center">
                                        <span className="text-sm font-medium text-gray-900 mr-2">{bankDetails.ifsc}</span>
                                        <button onClick={() => copyToClipboard(bankDetails.ifsc)} className="text-gray-400 hover:text-gray-600"><Copy className="h-3 w-3" /></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">UPI</h4>
                            <div className="flex justify-between items-center bg-white p-2 rounded border border-gray-100">
                                <span className="text-sm text-gray-500">UPI ID</span>
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-900 mr-2">{bankDetails.upi}</span>
                                    <button onClick={() => copyToClipboard(bankDetails.upi)} className="text-gray-400 hover:text-gray-600"><Copy className="h-3 w-3" /></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                            onClick={onClose}
                        >
                            I've made the payment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentInstructionsModal;
