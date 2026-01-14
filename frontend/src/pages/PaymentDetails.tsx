import React, { useEffect, useState } from 'react';
import { DollarSign, CreditCard, Calendar, AlertCircle, Download, Plus, Trash2, Tag } from 'lucide-react';
import api from '../api/axios';
import RecordPaymentModal from '../components/RecordPaymentModal';
import DiscountModal from '../components/DiscountModal';

interface Invoice {
    id: string;
    total: number;
    status: string; // DRAFT, SENT, PAID
    dueDate: string;
    issueDate: string;
    createdAt: string;
    clientId: string;
    serviceType?: string;
    client: {
        id: string;
        name: string;
    };
    task?: {
        title: string;
    };
    discount?: number;
}

interface ClientStat {
    id: string;
    name: string;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    discountedAmount: number;
    unbilledAmount: number;
    lastPaymentDate?: string;
}

interface PendingAmount {
    client: { id: string; name: string };
    amount: number;
    discounted: number;
    taskIds: string[];
}

const PaymentDetails: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clientStats, setClientStats] = useState<ClientStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<ClientStat | null>(null);

    const fetchInvoices = async () => {
        try {
            const [invoicesRes, pendingRes] = await Promise.all([
                api.get('/invoices'),
                api.get('/invoices/pending-amounts')
            ]);
            setInvoices(invoicesRes.data);
            calculateStats(invoicesRes.data, pendingRes.data);
        } catch (error) {
            console.error('Failed to fetch payment details', error);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateStats = (invoicesToProcess: Invoice[], pendingData: PendingAmount[] = []) => {
        const statsMap = new Map<string, ClientStat>();

        invoicesToProcess.forEach(inv => {
            if (!statsMap.has(inv.clientId)) {
                statsMap.set(inv.clientId, {
                    id: inv.clientId,
                    name: inv.client?.name || 'Unknown Client',
                    totalAmount: 0,
                    paidAmount: 0,
                    pendingAmount: 0,
                    discountedAmount: 0,
                    unbilledAmount: 0
                });
            }
            const stat = statsMap.get(inv.clientId)!;
            stat.totalAmount += inv.total;
            stat.discountedAmount += (inv.discount || 0);
            if (inv.status === 'PAID') {
                stat.paidAmount += inv.total;
            } else {
                stat.pendingAmount += inv.total;
            }
        });

        // Merge Pending (Unbilled) Amounts
        pendingData.forEach(item => {
            if (!statsMap.has(item.client.id)) {
                statsMap.set(item.client.id, {
                    id: item.client.id,
                    name: item.client.name,
                    totalAmount: 0,
                    paidAmount: 0,
                    pendingAmount: 0,
                    discountedAmount: 0,
                    unbilledAmount: 0
                });
            }
            const stat = statsMap.get(item.client.id)!;
            stat.unbilledAmount += item.amount;
            stat.pendingAmount += item.amount; // Add unbilled to total pending

            if (item.discounted) {
                stat.discountedAmount += item.discounted;
            }
        });

        setClientStats(Array.from(statsMap.values()));
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleRecordPaymentClick = (client: ClientStat) => {
        setSelectedClient(client);
        setIsPaymentModalOpen(true);
    };

    const handleDiscountClick = (client: ClientStat) => {
        setSelectedClient(client);
        setIsDiscountModalOpen(true);
    };

    const handleDownload = async (invoiceId: string) => {
        try {
            const response = await api.get(`/invoices/${invoiceId}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${invoiceId.slice(0, 8)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            fetchInvoices(); // Refresh status (DRAFT -> SENT)
        } catch (error) {
            console.error('Download failed', error);
        }
    };

    const handleDelete = async (invoiceId: string) => {
        if (!window.confirm('Are you sure you want to delete this invoice?')) return;
        try {
            await api.delete(`/invoices/${invoiceId}`);
            fetchInvoices();
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const totalRevenue = clientStats.reduce((sum, stat) => sum + stat.totalAmount, 0);
    const totalPaid = clientStats.reduce((sum, stat) => sum + stat.paidAmount, 0);
    const totalPending = clientStats.reduce((sum, stat) => sum + stat.pendingAmount, 0);
    const totalOverdue = invoices.filter(i => i.status === 'OVERDUE').reduce((sum, inv) => sum + inv.total, 0);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
            <p className="text-gray-500">Financial overview and payment tracking</p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-full">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <CreditCard className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">Paid</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{totalPaid.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-yellow-100 rounded-full">
                            <Calendar className="h-6 w-6 text-yellow-600" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">Pending</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{totalPending.toLocaleString()}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">₹{totalOverdue.toLocaleString()}</p>
                </div>
            </div>

            {/* Client-wise Payment Details */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Client-wise Payment Details</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Amount</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Amount</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Discounts</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {clientStats.map((stat) => (
                            <tr key={stat.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stat.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">₹{stat.totalAmount.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">₹{stat.paidAmount.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-yellow-600">₹{stat.pendingAmount.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600">₹{stat.discountedAmount.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                    <div className="flex justify-center space-x-2">
                                        <button
                                            onClick={() => handleRecordPaymentClick(stat)}
                                            className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Record
                                        </button>
                                        <button
                                            onClick={() => handleDiscountClick(stat)}
                                            className="text-purple-600 hover:text-purple-900 flex items-center"
                                            title="Apply Discount"
                                        >
                                            <Tag className="h-4 w-4 mr-1" /> Discount
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {clientStats.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No client payments found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Recent Invoices */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Invoices</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.slice(0, 10).map((invoice) => (
                            <tr key={invoice.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.task?.title || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">₹{invoice.total.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                            invoice.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'}`}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <button
                                        onClick={() => handleDownload(invoice.id)}
                                        className="text-indigo-600 hover:text-indigo-900 flex items-center justify-center mr-3 float-left"
                                        title="Download PDF"
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(invoice.id)}
                                        className="text-red-500 hover:text-red-700 flex items-center justify-center float-left"
                                        title="Delete Invoice"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Restricted Access</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                            <p>
                                This section contains sensitive financial information and is only accessible to administrators. All access is logged for security purposes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <RecordPaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSuccess={fetchInvoices}
                client={selectedClient}
            />

            <DiscountModal
                isOpen={isDiscountModalOpen}
                onClose={() => setIsDiscountModalOpen(false)}
                onSuccess={fetchInvoices}
                client={selectedClient}
            />
        </div>
    );
};

export default PaymentDetails;
