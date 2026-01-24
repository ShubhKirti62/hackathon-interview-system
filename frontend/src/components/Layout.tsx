import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_ROUTES } from '../routes';
import ThemeToggle from './ThemeToggle';
import { LogOut, User } from 'lucide-react';

const Layout: React.FC = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const location = useLocation();

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{ borderBottom: '1px solid var(--border-color)', padding: '1rem 0', backgroundColor: 'var(--bg-primary)' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link to={APP_ROUTES.HOME} style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', textDecoration: 'none' }}>
                        InterviewSys
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <ThemeToggle />

                        {isAuthenticated ? (
                            <>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                                    <User size={18} /> {user?.name}
                                </span>
                                <button onClick={logout} className="btn" style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                    <LogOut size={18} />
                                </button>
                            </>
                        ) : (
                            location.pathname !== APP_ROUTES.LOGIN && (
                                <Link to={APP_ROUTES.LOGIN} className="btn btn-primary">Login</Link>
                            )
                        )}
                    </div>
                </div>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
