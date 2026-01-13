import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    FolderKanban,
    FileText,
    CreditCard,
    Clock,
    CheckCircle2,
    AlertCircle,
    Download,
    Search,
    Bell,
    Settings,
    ChevronRight,
    ArrowUpRight
} from 'lucide-react';
import api from '../api/axios';
import { format } from 'date-fns';
import RequestProjectModal from '../components/RequestProjectModal';
import PaymentInstructionsModal from '../components/PaymentInstructionsModal';

interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    createdAt: string;
    progress?: number;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    total: number;
    status: string;
    dueDate: string;
    issueDate: string;
}

const ClientDashboard: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('Overview');
    const [projects, setProjects] = useState<Project[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modals
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedInvoiceAmount, setSelectedInvoiceAmount] = useState<number>(0);

    const fetchData = async () => {
        try {
            const projectsRes = await api.get('/projects');
            const projectsWithProgress = projectsRes.data.map((p: any) => ({
                ...p,
                progress: Math.floor(Math.random() * 100)
            }));
            setProjects(projectsWithProgress);

            const invoicesRes = await api.get('/invoices');
            setInvoices(invoicesRes.data);
        } catch (error) {
            console.error('Failed to fetch portal data', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
        try {
            const response = await api.get(`/invoices/${invoiceId}/download`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to download invoice', error);
            alert('Failed to download invoice');
        }
    };

    const handlePayClick = (amount: number) => {
        setSelectedInvoiceAmount(amount);
        setIsPaymentModalOpen(true);
    };

    const handleRequestProjectSuccess = () => {
        fetchData(); // Refresh projects list
        setActiveTab('Projects'); // Switch to projects tab
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ON_HOLD': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'PAID': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'SENT': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'OVERDUE': return 'bg-red-100 text-red-800 border-red-200';
            case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const tabs = [
        { id: 'Overview', icon: LayoutDashboard },
        { id: 'Projects', icon: FolderKanban },
        { id: 'Invoices', icon: FileText },
        { id: 'Files', icon: Download },
    ];

    const activeProjectCount = projects.filter(p => p.status === 'ACTIVE').length;
    const pendingInvoicesAmount = invoices
        .filter(i => i.status !== 'PAID')
        .reduce((sum, i) => sum + (i.total || 0), 0);
    const recentActivity = [
        { id: 1, text: 'New concept art uploaded for review', time: '2 hours ago', type: 'file' },
        { id: 2, text: 'Invoice #INV-2024-001 created', time: '1 day ago', type: 'invoice' },
        { id: 3, text: 'Project "Website Redesign" moved to Development', time: '2 days ago', type: 'project' },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans">
            {user?.role !== 'CLIENT' && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-amber-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-amber-700">
                                You are viewing the Client Portal as an <span className="font-bold">{user?.role}</span>. This is a preview of what clients see.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-display">Welcome back, {user?.name}</h1>
                    <p className="text-gray-500 mt-1">Here's what's happening with your projects today.</p>
                </div>
                <div className="flex gap-3">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                        <Search className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>
                    <div className="h-8 w-px bg-gray-200 mx-2"></div>
                    <button
                        onClick={() => setIsRequestModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm text-sm font-medium"
                    >
                        <ArrowUpRight className="h-4 w-4" />
                        Request New Project
                    </button>
                </div>
            </div>

            <div className="flex space-x-1 mb-6 border-b border-gray-200/60 overflow-x-auto pb-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            group flex items-center px-6 py-3 text-sm font-medium rounded-t-lg transition-all relative
                            ${activeTab === tab.id
                                ? 'text-indigo-600 bg-white border-x border-t border-gray-200 -mb-px shadow-[0_-2px_4px_rgba(0,0,0,0.02)]'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}
                        `}
                    >
                        <tab.icon className={`mr-2 h-4 w-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500'}`} />
                        {tab.id}
                        {activeTab === tab.id && (
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>
                        )}
                    </button>
                ))}
            </div>

            <div className="animate-fade-in pb-10">
                {activeTab === 'Overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-soft">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                            <FolderKanban className="h-5 w-5 text-white" />
                                        </div>
                                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded text-white/90">Updated today</span>
                                    </div>
                                    <h3 className="text-3xl font-bold font-display">{activeProjectCount}</h3>
                                    <p className="text-indigo-100 text-sm mt-1">Active Projects</p>
                                </div>
                                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-amber-50 rounded-lg">
                                            <CreditCard className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded">Action Required</span>
                                    </div>
                                    <h3 className="text-3xl font-bold font-display text-gray-900">₹{pendingInvoicesAmount.toLocaleString()}</h3>
                                    <p className="text-gray-500 text-sm mt-1">Outstanding Balance</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-900">Active Projects</h3>
                                    <button
                                        onClick={() => setActiveTab('Projects')}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
                                    >
                                        View All <ChevronRight className="h-4 w-4 ml-1" />
                                    </button>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {projects.slice(0, 3).map((project) => (
                                        <div key={project.id} className="p-6 hover:bg-gray-50/50 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{project.name}</h4>
                                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{project.description}</p>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getStatusColor(project.status)}`}>
                                                    {project.status}
                                                </span>
                                            </div>
                                            <div className="mt-4">
                                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                    <span>Progress</span>
                                                    <span>{project.progress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                                                        style={{ width: `${project.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {projects.length === 0 && (
                                        <div className="p-8 text-center text-gray-500 text-sm">No active projects found.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-soft">
                                <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => { setActiveTab('Invoices'); }}
                                        className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/5 group"
                                    >
                                        <div className="flex items-center">
                                            <CreditCard className="h-5 w-5 mr-3 text-indigo-300" />
                                            <span className="text-sm font-medium">Pay Invoices</span>
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab('Files'); }}
                                        className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/5 group"
                                    >
                                        <div className="flex items-center">
                                            <Download className="h-5 w-5 mr-3 text-emerald-300" />
                                            <span className="text-sm font-medium">Download Assets</span>
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                                    </button>
                                    <button
                                        onClick={() => alert('Support system coming soon!')}
                                        className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all border border-white/5 group"
                                    >
                                        <div className="flex items-center">
                                            <AlertCircle className="h-5 w-5 mr-3 text-amber-300" />
                                            <span className="text-sm font-medium">Report Issue</span>
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Recent Activity</h3>
                                <div className="space-y-6">
                                    {recentActivity.map((activity, index) => (
                                        <div key={activity.id} className="flex relative">
                                            {index !== recentActivity.length - 1 && (
                                                <div className="absolute top-8 left-2.5 w-px h-full bg-gray-100"></div>
                                            )}
                                            <div className={`
                                                flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 bg-white
                                                ${activity.type === 'file' ? 'border-emerald-500' :
                                                    activity.type === 'invoice' ? 'border-amber-500' : 'border-blue-500'}
                                            `}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${activity.type === 'file' ? 'bg-emerald-500' : activity.type === 'invoice' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm text-gray-700">{activity.text}</p>
                                                <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Projects' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {projects.map((project) => (
                                    <tr key={project.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{project.name}</div>
                                            <div className="text-xs text-gray-500 truncate mt-1 max-w-xs">{project.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(project.status)}`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(project.createdAt), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-24 bg-gray-100 rounded-full h-2">
                                                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${project.progress}%` }}></div>
                                                </div>
                                                <span className="text-xs text-gray-500">{project.progress}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'Invoices' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            {invoice.invoiceNumber}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-gray-900">
                                            ₹{(invoice.total || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            {invoice.status !== 'PAID' ? (
                                                <button
                                                    onClick={() => handlePayClick(invoice.total)}
                                                    className="text-indigo-600 hover:text-indigo-900 font-medium text-xs border border-indigo-200 px-3 py-1 rounded bg-indigo-50 hover:bg-indigo-100"
                                                >
                                                    Pay Now
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleDownloadInvoice(invoice.id, invoice.invoiceNumber)}
                                                    className="text-gray-500 hover:text-gray-700 font-medium text-xs flex items-center justify-end ml-auto"
                                                >
                                                    <Download className="h-4 w-4 mr-1" /> PDF
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'Files' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center text-gray-500">
                        <FolderKanban className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Shared Files</h3>
                        <p className="mt-1">No files have been shared with you yet.</p>
                        <p className="text-xs text-gray-400 mt-2">Files are usually shared within 24 hours of project kick-off.</p>
                    </div>
                )}
            </div>

            <RequestProjectModal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                onRequestSent={handleRequestProjectSuccess}
            />

            <PaymentInstructionsModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                invoiceAmount={selectedInvoiceAmount}
            />
        </div>
    );
};

export default ClientDashboard;
