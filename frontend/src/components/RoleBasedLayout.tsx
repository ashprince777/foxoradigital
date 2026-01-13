import React from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from './Layout';
import ClientLayout from './ClientLayout';

const RoleBasedLayout: React.FC = () => {
    const { user } = useAuth();

    if (user?.role === 'CLIENT') {
        return <ClientLayout />;
    }

    return <Layout />;
};

export default RoleBasedLayout;
