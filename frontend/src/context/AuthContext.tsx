import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/endpoints';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'candidate' | 'interviewer' | 'hr';
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Note: We need a way to navigate inside the provider if not wrapping App
    // But typically AuthProvider wraps App, so we might not be able to use useNavigate immediately unless we structure it carefully.
    // For simplicity, we'll let the Login component handle navigation after calling login().

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get(API_ENDPOINTS.AUTH.ME);
                    setUser(res.data);
                } catch (error) {
                    console.error("Auth check failed", error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = useCallback((token: string, userData: User) => {
        localStorage.setItem('token', token);
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login';
    }, []);

    const value = React.useMemo(() => ({
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user
    }), [user, loading, login, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
