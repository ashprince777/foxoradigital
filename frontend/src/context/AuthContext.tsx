import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    allowedMenus?: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('/auth/me');
                    setUser(response.data.user);
                } catch (error) {
                    localStorage.removeItem('token');
                }
            }
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    const login = (token: string, user: User) => {
        localStorage.setItem('token', token);
        setUser(user);
    };

    const logout = async () => {
        try {
            const currentTimer = await api.get('/time/current');
            if (currentTimer.data && currentTimer.data.id) {
                await api.put(`/time/${currentTimer.data.id}/stop`, { idleDuration: 0 });
            }
        } catch (error) {
            console.error('Error stopping timer on logout:', error);
        }
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
