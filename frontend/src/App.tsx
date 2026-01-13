import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import UsersPage from './pages/Users';
import Calendar from './pages/Calendar';
import Clients from './pages/Clients';
import RoleBasedLayout from './components/RoleBasedLayout';
import ClientDashboard from './pages/ClientDashboard';
import Invoices from './pages/Invoices';
import PaymentDetails from './pages/PaymentDetails';
import Settings from './pages/Settings';
import Reports from './pages/Reports';

// ... imports

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const DashboardRoleWrapper: React.FC = () => {
    const { user } = useAuth();
    if (user?.role === 'CLIENT') {
        return <Navigate to="/client/dashboard" replace />;
    }
    return <Dashboard />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/"
                        element={
                            <PrivateRoute>
                                <RoleBasedLayout />
                            </PrivateRoute>
                        }
                    >
                        {/* Common Routes */}

                        {/* Admin/Creator Routes */}
                        <Route index element={<DashboardRoleWrapper />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="tasks" element={<Tasks />} />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="calendar" element={<Calendar />} />
                        <Route path="clients" element={<Clients />} />
                        <Route path="payment" element={<PaymentDetails />} />
                        <Route path="invoices" element={<Invoices />} />
                        <Route path="settings" element={<Settings />} />

                        {/* Client Only Routes */}
                        <Route path="client/dashboard" element={<ClientDashboard />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
