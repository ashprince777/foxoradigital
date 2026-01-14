import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { FileText, Plus, Search, Filter, Download, DollarSign, Clock, AlertCircle, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import NewInvoiceModal from '../components/NewInvoiceModal';
import GenerateMonthlyInvoicesModal from '../components/GenerateMonthlyInvoicesModal';
import GenerateCustomInvoiceModal from '../components/GenerateCustomInvoiceModal';

interface Client {
    id: string;
    name: string;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    amount: number;
    total: number;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
    dueDate: string;
    issueDate: string;
    createdAt: string;
    client: Client;
}

const Invoices: React.FC = () => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');

    // Modals
    const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
    const [showMonthlyModal, setShowMonthlyModal] = useState(false);
    const [showCustomInvoiceModal, setShowCustomInvoiceModal] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, [user]);

    const fetchInvoices = async () => {
        console.log('Fetching invoices...');
        try {
            const response = await api.get('/invoices');
            console.log('Invoices fetched:', response.data);
            setInvoices(response.data);
        } catch (error) {
            console.error('Failed to fetch invoices', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async (invoiceId: string, invoiceNumber: string) => {
        try {
            const response = await api.get(`/invoices/${invoiceId}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            fetchInvoices();
        } catch (error) {
            console.error('Download failed', error);
        }
    };

    const handleDelete = async (invoiceId: string) => {
        if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) return;
        try {
            await api.delete(`/invoices/${invoiceId}`);
            setInvoices(invoices.filter(inv => inv.id !== invoiceId));
        } catch (error) {
            console.error('Delete failed', error);
            alert('Failed to delete invoice');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-green-100 text-green-800';
            case 'SENT': return 'bg-blue-100 text-blue-800';
            case 'OVERDUE': return 'bg-red-100 text-red-800';
            case 'DRAFT': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredInvoices = filterStatus === 'ALL'
        ? invoices
        : invoices.filter(inv => inv.status === filterStatus);

    // Stats
    const totalRevenue = invoices.reduce((sum, i) => sum + (i.total || i.amount || 0), 0);
    const pendingAmount = invoices.filter(i => i.status !== 'PAID' && i.status !== 'OVERDUE').reduce((sum, i) => sum + i.total, 0);
    const overdueAmount = invoices.filter(i => i.status === 'OVERDUE').reduce((sum, i) => sum + i.total, 0);
    const totalCount = invoices.length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-display">Invoices</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage billing and payments</p>
                </div>
                {user?.role !== 'CLIENT' && (
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowMonthlyModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                            <Calendar className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" /> {/* Calendar icon imported? No, wait. */}
                            {/* Wait, I didn't import Calendar in this file. Adding it to imports or using Clock/FileText */}
                            Generate Monthly Invoices
                        </button>
                        <button
                            onClick={() => setShowCustomInvoiceModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                        >
                            <FileText className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                            Custom Invoice
                        </button>
                        <button
                            onClick={() => setShowNewInvoiceModal(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                            New Invoice
                        </button>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-full">
                            <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">Pending</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{pendingAmount.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{overdueAmount.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-soft border border-gray-100">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-full">
                            <FileText className="h-5 w-5 text-purple-600" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">Total Invoices</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
                {['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        {status === 'ALL' ? `All (${invoices.length})` : `${status.charAt(0) + status.slice(1).toLowerCase()} (${invoices.filter(i => i.status === status).length})`}
                    </button>
                ))}
            </div>

            {/* Invoices List */}
            <div className="bg-white shadow-soft rounded-xl border border-gray-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">Loading invoices...</td>
                                </tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                                        <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                                            <FileText className="h-full w-full" />
                                        </div>
                                        No invoices found.
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {invoice.client?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(invoice.createdAt || invoice.issueDate || new Date()), 'MM/dd/yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(invoice.dueDate), 'MM/dd/yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                            ₹{(invoice.total || invoice.amount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <button
                                                onClick={() => handleDownload(invoice.id, invoice.invoiceNumber)}
                                                className="text-indigo-600 hover:text-indigo-900 flex items-center justify-center mr-3"
                                                title="Download PDF"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(invoice.id)}
                                                className="text-red-500 hover:text-red-700 flex items-center justify-center"
                                                title="Delete Invoice"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <NewInvoiceModal
                isOpen={showNewInvoiceModal}
                onClose={() => setShowNewInvoiceModal(false)}
                onCreated={fetchInvoices}
            />

            <GenerateMonthlyInvoicesModal
                isOpen={showMonthlyModal}
                onClose={() => setShowMonthlyModal(false)}
                onGenerated={fetchInvoices}
            />

            <GenerateCustomInvoiceModal
                isOpen={showCustomInvoiceModal}
                onClose={() => setShowCustomInvoiceModal(false)}
                onGenerated={fetchInvoices}
            />
        </div>
    );
};

export default Invoices;
