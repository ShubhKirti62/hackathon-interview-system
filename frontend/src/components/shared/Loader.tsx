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

    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;
    if (!isLoading && !showSkeleton) return null;

    return (
        <div className="loader-overlay">
            <div className="loader-card glass">
                <div className="loader-icon-wrapper">
                    <div className="loader-ping"></div>
                    <Loader2 className="loader-spin" size={48} />
                </div>

                <div className="loader-content">
                    <h3 className="loader-title">
                        Processing
                    </h3>
                    <p key={messageIndex} className="loader-message animate-fade-in">
                        {loadingMessages[messageIndex]}
                    </p>
                </div>
            </div>
            <style>{`
                .loader-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(255, 255, 255, 0.4);
                    z-index: 9999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    transition: all 0.3s ease;
                }

                [data-theme='dark'] .loader-overlay {
                    background-color: rgba(15, 23, 42, 0.6);
                }

                .loader-card {
                    background: var(--bg-card);
                    padding: 3rem;
                    border-radius: 1.5rem;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1.5rem;
                    min-width: 320px;
                    border: 1px solid var(--border-color);
                    position: relative;
                    overflow: hidden;
                }
                
                /* Glass effect boost */
                .loader-card.glass {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                }
                [data-theme='dark'] .loader-card.glass {
                    background: rgba(30, 41, 59, 0.9);
                }

                .loader-icon-wrapper {
                    position: relative;
                    padding: 0.5rem;
                }

                .loader-ping {
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    background-color: var(--primary);
                    opacity: 0.2;
                    animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
                }

                .loader-spin {
                    color: var(--primary);
                    position: relative;
                    z-index: 10;
                    animation: spin 1.5s linear infinite;
                }

                .loader-content {
                    text-align: center;
                }

                .loader-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0 0 0.5rem 0;
                    letter-spacing: -0.025em;
                }

                .loader-message {
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                    min-height: 1.5em;
                    font-weight: 500;
                }

                .animate-fade-in {
                    animation: fadeIn 0.5s ease-in-out;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes ping {
                    0% { transform: scale(0.8); opacity: 0.3; }
                    75%, 100% { transform: scale(2.5); opacity: 0; }
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Loader;
