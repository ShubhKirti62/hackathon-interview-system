import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, FileText, LayoutDashboard, User } from 'lucide-react';
import { APP_ROUTES } from '../routes';

const LandingPage: React.FC = () => {
    return (
        <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '3rem' }}>
                <Bot size={64} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                    AI Assisted Interview System
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                    Streamline your hiring process with AI-powered interviews, automated feedback, and comprehensive analytics.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                <FeatureCard
                    icon={<User size={32} />}
                    title="For Candidates"
                    description="Experience a seamless AI-led interview process with instant feedback."
                    link={APP_ROUTES.INTERVIEW.INTRO}
                    linkText="Start Interview"
                />
                <FeatureCard
                    icon={<LayoutDashboard size={32} />}
                    title="For HR & Admins"
                    description="Manage candidates, questions, and view detailed performance reports."
                    link={APP_ROUTES.ADMIN.DASHBOARD}
                    linkText="Admin Dashboard"
                />
            </div>

            <div style={{ padding: '2rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '1rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--text-primary)' }}>Key Features</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
                    <FeatureItem icon={<Bot />} text="AI Interviewer" />
                    <FeatureItem icon={<FileText />} text="Speech to Text" />
                    <FeatureItem icon={<LayoutDashboard />} text="Auto Scoring" />
                    <FeatureItem icon={<LayoutDashboard />} text="Real-time Analytics" />
                </div>
            </div>
        </div>
    );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string, link: string, linkText: string }> = ({ icon, title, description, link, linkText }) => (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{icon}</div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', flex: 1 }}>{description}</p>
        <Link to={link} className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>{linkText}</Link>
    </div>
);

const FeatureItem: React.FC<{ icon: React.ReactNode, text: string }> = ({ icon, text }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-primary)' }}>
        <div style={{ color: 'var(--success)' }}>{icon}</div>
        <span style={{ fontWeight: 500 }}>{text}</span>
    </div>
);

export default LandingPage;
