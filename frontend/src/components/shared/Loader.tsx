import React from 'react';
import { useLoaderStore } from '../../store/loaderStore';
import { Loader2 } from 'lucide-react';

const Loader: React.FC = () => {
    const isLoading = useLoaderStore((state) => state.isLoading);
    const showSkeleton = useLoaderStore((state) => state.showSkeleton);
    const [messageIndex, setMessageIndex] = React.useState(0);

    const loadingMessages = [
        "Preparing your interview experience...",
        "Analyzing candidate profiles...",
        "Connecting to AI engine...",
        "Securing data channels...",
        "Optimizing workflow..."
    ];

    React.useEffect(() => {
        if (!isLoading) return;

        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [isLoading]);

    if (!isLoading && !showSkeleton) return null;

    if (showSkeleton) {
        // We can add specific skeleton loaders here if needed later
        // For now, fall back to default loader or return null if you want a skeleton specifically
        // But since we haven't implemented skeletons yet, we'll just show the spinner
        // return <div className="skeleton-overlay">Loading skeleton...</div>; 
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)', // Lighter backdrop
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: 'white',
                padding: '2.5rem',
                borderRadius: '1.5rem',
                boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1.5rem',
                minWidth: '300px'
            }}>
                <div style={{ position: 'relative' }}>
                    <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                    <Loader2 className="animate-spin text-blue-600 relative z-10" size={56} />
                </div>

                <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
                        Processing
                    </h3>
                    <p key={messageIndex} className="animate-fade-in" style={{ color: '#64748b', fontSize: '0.95rem', minHeight: '1.5em' }}>
                        {loadingMessages[messageIndex]}
                    </p>
                </div>
            </div>
            <style>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                .animate-ping {
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes ping {
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Loader;
