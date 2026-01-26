import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/endpoints';
import { APP_ROUTES } from '../routes';
import { Rocket, Users, UserPlus, Eye, EyeOff } from 'lucide-react';
import { showToast } from '../utils/toast';

const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post(API_ENDPOINTS.AUTH.REGISTER, { name, email, password, role: 'admin' });
            // Automatically login after register
            login(res.data.token, res.data.user);
            showToast.success('Admin account created successfully!');
            navigate(APP_ROUTES.ADMIN.DASHBOARD);
        } catch (err: any) {
            showToast.error(err.response?.data?.msg || 'Registration failed');
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Left Side - Hero/Branding */}
            <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                padding: '4rem',
                position: 'relative',
                overflow: 'hidden'
            }} className="hidden-mobile">
                {/* ... (omitted content same as before) */}
                <div style={{ position: 'absolute', top: '10%', right: '10%', opacity: 0.1 }} className="animate-float">
                    <Rocket size={100} />
                </div>
                <div style={{ position: 'absolute', bottom: '10%', left: '10%', opacity: 0.1, animationDelay: '3s' }} className="animate-float">
                    <Users size={120} />
                </div>

                <div style={{ zIndex: 2, textAlign: 'center' }} className="animate-fade-in">
                    <div style={{ marginBottom: '2rem', display: 'inline-block' }}>
                        <div style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            padding: '1.5rem',
                            borderRadius: '2rem',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <UserPlus size={64} color="#34d399" />
                        </div>
                    </div>
                    <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                        Join the <span style={{ color: '#34d399' }}>Revolution</span>
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: '#cbd5e1', maxWidth: '400px', lineHeight: '1.6' }}>
                        Start optimizing your hiring process today. Simple, fast, and intelligent.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                backgroundColor: 'var(--bg-primary)',
                position: 'relative'
            }}>
                <div style={{ width: '100%', maxWidth: '420px' }} className="animate-slide-up">
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Create Account</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Join us and streamline your workflow.</p>
                    </div>

                    <div style={{ 
                        marginBottom: '1.5rem', 
                        padding: '1rem', 
                        backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                        border: '1px solid rgba(59, 130, 246, 0.3)', 
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <strong style={{ color: 'var(--primary)' }}>� Admin Registration Only:</strong> This registration page is for administrators only. Candidates are created by admins through resume upload and can sign in with their email and default password.
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Full Name</label>
                            <input
                                type="text"
                                className="input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Email Address</label>
                            <input
                                type="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@example.com"
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '0.75rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-secondary)',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>Create Admin Account</button>
                        <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Already have an account? <Link to={APP_ROUTES.LOGIN} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Sign in</Link>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
                @media (max-width: 900px) {
                    .hidden-mobile {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default RegisterPage;
