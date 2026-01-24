import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/endpoints';
import { APP_ROUTES } from '../routes';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('admin@example.com');
    const [password, setPassword] = useState('123456');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
            login(res.data.token, res.data.user);
            if (res.data.user.role === 'admin' || res.data.user.role === 'hr') {
                navigate(APP_ROUTES.ADMIN.DASHBOARD);
            } else {
                navigate(APP_ROUTES.HOME);
            }
        } catch (err: any) {
            setError(err.response?.data?.msg || 'Login failed');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Login</h2>
                {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
                    <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Use admin@example.com / 123456
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
