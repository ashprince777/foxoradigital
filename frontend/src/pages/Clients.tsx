import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import CreateClientModal from '../components/CreateClientModal';
import EditClientModal from '../components/EditClientModal';

interface Client {
    id: string;
    name: string;
    email: string;
    phone?: string;
    projects: { id: string; name: string }[];
    status?: string;
    plan?: string;
    facebookAds?: boolean;
    googleAds?: boolean;
    facebookAdsPrice?: number;
    googleAdsPrice?: number;
    posterDesignPrice?: number;
    videoEditingPrice?: number;
    aiVideoPrice?: number;
    documentEditingPrice?: number;
    otherWorkPrice?: number;
}

const Clients: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    const fetchClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (error) {
            console.error('Failed to fetch clients', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleClientCreated = () => {
        fetchClients();
    };

    const handleClientUpdated = () => {
        fetchClients();
    };

    const handleEditClick = (clientId: string) => {
        setSelectedClientId(clientId);
        setIsEditModalOpen(true);
    };

    if (isLoading) return <div>Loading clients...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                    New Client
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {clients.map((client) => (
                        <li
                            key={client.id}
                            className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleEditClick(client.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="text-sm font-medium text-indigo-600 truncate">{client.name}</div>
                                    {client.status && (
                                        <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${client.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {client.status}
                                        </span>
                                    )}
                                </div>
                                <div className="ml-2 flex-shrink-0 flex">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                        {client.projects.length} Projects
                                    </span>
                                </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                                <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-500">
                                        {client.email}
                                    </p>
                                    {client.phone && (
                                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                            {client.phone}
                                        </p>
                                    )}
                                    {client.plan && (
                                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                            {client.plan}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </li>
                    ))}
                    {clients.length === 0 && (
                        <li className="px-4 py-10 text-center text-gray-500">
                            No clients found. Click "New Client" to add one.
                        </li>
                    )}
                </ul>
            </div>

            <CreateClientModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onClientCreated={handleClientCreated}
            />

            <EditClientModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onClientUpdated={handleClientUpdated}
                clientId={selectedClientId}
            />
        </div>
    );
};

export default Clients;
