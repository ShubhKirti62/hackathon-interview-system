import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/endpoints';
import { APP_ROUTES } from '../routes';


const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('hr'); // Default role
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post(API_ENDPOINTS.AUTH.REGISTER, { name, email, password, role });
            // Automatically login after register
            login(res.data.token, res.data.user);
            if (res.data.user.role === 'admin' || res.data.user.role === 'hr') {
                navigate(APP_ROUTES.ADMIN.DASHBOARD);
            } else {
                navigate(APP_ROUTES.CANDIDATE.DASHBOARD);
            }
        } catch (err: any) {
            setError(err.response?.data?.msg || 'Registration failed');
        }
    };

    return (
        <div style={{
            display: 'flex',
            height: '100%',
            minHeight: '100vh',
            backgroundColor: '#0ea5e9',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Floating Card */}
            <div style={{
                display: 'flex',
                width: '900px',
                height: '650px', // Slightly taller for extra fields
                backgroundColor: 'white',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                position: 'relative'
            }} className="animate-slide-up">

                {/* Left Panel - Blue Gradient */}
                <div style={{
                    flex: '0.9',
                    background: 'linear-gradient(180deg, #0ea5e9 0%, #2563eb 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: 'white',
                    padding: '3rem',
                    position: 'relative',
                    overflow: 'hidden'
                }} className="hidden-mobile">

                    {/* Top Left Blob */}
                    <div style={{
                        position: 'absolute',
                        top: '-10%',
                        left: '-20%',
                        width: '300px',
                        height: '300px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
                    }} />

                    {/* Bottom Right Blob */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-10%',
                        right: '-20%',
                        width: '300px',
                        height: '300px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
                    }} />

                    <div style={{ zIndex: 2, textAlign: 'center' }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
                            Join Us
                        </h1>
                        <p style={{ fontSize: '0.9rem', fontWeight: '500', opacity: 0.9, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                            Create Your Account
                        </p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7, lineHeight: '1.6', maxWidth: '300px', margin: '0 auto' }}>
                            Start optimizing your hiring process today. Simple, fast, and intelligent.
                        </p>
                    </div>
                </div>

                {/* Right Panel - Register Form */}
                <div style={{
                    flex: 1,
                    padding: '3rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                    overflowY: 'auto'
                }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>Register</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Create a new account to get started</p>
                    </div>

                    {error && (
                        <div style={{
                            padding: '10px',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            borderRadius: '6px',
                            marginBottom: '1rem',
                            fontSize: '0.8rem',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem' }}>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Full Name"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#f1f5f9',
                                    border: 'none',
                                    color: '#334155',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}
                                className="input-reset"
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email Address"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#f1f5f9',
                                    border: 'none',
                                    color: '#334155',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}
                                className="input-reset"
                            />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#f1f5f9',
                                    border: 'none',
                                    color: '#334155',
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}
                                className="input-reset"
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>I am a...</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: '#f1f5f9',
                                    border: 'none',
                                    color: '#334155',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                                className="input-reset"
                            >
                                <option value="hr">HR / Recruiter</option>
                                <option value="interviewer">Interviewer</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <button type="submit" style={{
                            width: '100%',
                            padding: '0.875rem',
                            backgroundColor: '#0f172a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginBottom: '1rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            Get Started
                        </button>

                        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
                            Already have an account? <Link to={APP_ROUTES.LOGIN} style={{ color: '#2563eb', fontWeight: 'bold' }}>Sign In</Link>
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
                .input-reset:focus {
                    outline: 2px solid #3b82f6;
                    background-color: white !important;
                }
            `}</style>
        </div>
    );
};

export default RegisterPage;
