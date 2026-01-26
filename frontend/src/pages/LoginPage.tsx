import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/endpoints';
import { APP_ROUTES } from '../routes';
import { Brain, Target, TrendingUp, Cpu, Lock, Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('candidate@example.com');
    const [password, setPassword] = useState('123456');
    const [error, setError] = useState('');
    const { login, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'admin') {
                navigate(APP_ROUTES.ADMIN.DASHBOARD);
            } else {
                navigate(APP_ROUTES.CANDIDATE.DASHBOARD);
            }
        }
    }, [isAuthenticated, user, navigate]);

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
            login(res.data.token, res.data.user);
            if (res.data.user.role === 'admin') {
                navigate(APP_ROUTES.ADMIN.DASHBOARD);
            } else {
                navigate(APP_ROUTES.CANDIDATE.DASHBOARD);
            }
        } catch (err: any) {
            setError(err.response?.data?.msg || 'Login failed');
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Left Side - Hero/Branding */}
            <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                padding: '4rem',
                position: 'relative',
                overflow: 'hidden'
            }} className="hidden-mobile">
                {/* Abstract Background Shapes */}
                <div style={{ position: 'absolute', top: '10%', left: '10%', opacity: 0.1 }} className="animate-float">
                    <Brain size={120} />
                </div>
                <div style={{ position: 'absolute', bottom: '10%', right: '10%', opacity: 0.1, animationDelay: '2s' }} className="animate-float">
                    <Target size={120} />
                </div>

                <div style={{ zIndex: 2, textAlign: 'center' }} className="animate-fade-in">
                    <div style={{ marginBottom: '2rem', display: 'inline-block' }}>
                        <div style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            padding: '1.5rem',
                            borderRadius: '2rem',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <Cpu size={64} color="#60a5fa" />
                        </div>
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '1.5rem', background: 'linear-gradient(to right, #60a5fa, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Hire Smarter.
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '400px', lineHeight: '1.6' }}>
                        AI-powered interviews that deliver deep insights and save rigorous time.
                    </p>

                    <div style={{ marginTop: '4rem', display: 'flex', gap: '2rem', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '0.5rem' }}><Brain size={24} /></div>
                            <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>AI Analysis</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '0.5rem' }}><TrendingUp size={24} /></div>
                            <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>Predictive</span>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '0.75rem', marginBottom: '0.5rem' }}><Lock size={24} /></div>
                            <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>Secure</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
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
                        <div style={{
                            width: '50px',
                            height: '50px',
                            background: 'var(--primary)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            <Lock color="white" size={24} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Welcome Back</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Please enter your details to sign in.</p>
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--error)',
                            color: 'var(--error)',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }} className="animate-fade-in">
                            <span style={{ fontSize: '1.25rem' }}>!</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Email Address</label>
                            <input
                                type="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Password</label>
                                <a href="#" style={{ fontSize: '0.875rem', color: 'var(--primary)' }}>Forgot password?</a>
                            </div>
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

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
                            Sign In
                        </button>

                        <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Don't have an account? <Link to={APP_ROUTES.REGISTER} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Create an account</Link>
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

export default LoginPage;
