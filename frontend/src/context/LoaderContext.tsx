import React, { createContext, useContext, useState } from 'react';

type LoaderContextType = {
    isLoading: boolean;
    showLoader: () => void;
    hideLoader: () => void;
};

const LoaderContext = createContext<LoaderContextType>({
    isLoading: false,
    showLoader: () => { },
    hideLoader: () => { },
});

export const useLoader = () => useContext(LoaderContext);

export const LoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);

    // Using a counter to handle multiple parallel requests
    const [, setLoadingCounter] = useState(0);

    const showLoader = () => {
        setLoadingCounter((prev) => {
            const newCount = prev + 1;
            if (newCount > 0) setIsLoading(true);
            return newCount;
        });
    };

    const hideLoader = () => {
        setLoadingCounter((prev) => {
            const newCount = Math.max(0, prev - 1);
            if (newCount === 0) setIsLoading(false);
            return newCount;
        });
    };

    return (
        <LoaderContext.Provider value={{ isLoading, showLoader, hideLoader }}>
            {children}
            {isLoading && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 9999,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backdropFilter: 'blur(2px)' // subtle blur
                }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '5px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '50%',
                        borderTop: '5px solid #3b82f6',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            )}
        </LoaderContext.Provider>
    );
};
