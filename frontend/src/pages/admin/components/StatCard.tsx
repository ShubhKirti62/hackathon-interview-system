import React from 'react';

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', color: 'var(--primary)' }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{value}</div>
        </div>
    </div>
);

export default StatCard;
