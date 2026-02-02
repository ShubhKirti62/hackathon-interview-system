import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    isDangerous?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    isDangerous = false
}) => {
    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-card)', borderRadius: '0.75rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: isDangerous ? 'var(--error)' : 'var(--text-primary)' }}>
                        {isDangerous && <AlertTriangle size={24} />}
                        {title}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>
                <div style={{ padding: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1rem' }}>
                    {message}
                </div>
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button onClick={onClose} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 1.5rem' }}>Cancel</button>
                    <button onClick={onConfirm} className="btn" style={{ backgroundColor: isDangerous ? 'var(--error)' : 'var(--primary)', color: 'white', border: 'none', padding: '0.5rem 1.5rem', fontWeight: 'bold' }}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
