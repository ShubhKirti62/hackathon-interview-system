import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/endpoints';

export type VerificationStatus = 'idle' | 'pending' | 'verified' | 'failed' | 'mismatch';

interface FaceVerificationState {
    isRegistered: boolean;
    verificationStatus: VerificationStatus;
    lastVerifiedAt: Date | null;
    mismatchCount: number;
    registeredDescriptor: number[] | null;
    isScreenSharing: boolean;
}

interface FaceVerificationContextType extends FaceVerificationState {
    registerFace: (descriptor: Float32Array, candidateId: string) => Promise<boolean>;
    verifyFace: (descriptor: Float32Array, candidateId: string) => Promise<{ verified: boolean; distance: number }>;
    resetVerification: () => void;
    incrementMismatchCount: () => void;
    setScreenSharing: (isSharing: boolean) => void;
}

const FaceVerificationContext = createContext<FaceVerificationContextType | undefined>(undefined);

export const FaceVerificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<FaceVerificationState>({
        isRegistered: false,
        verificationStatus: 'idle',
        lastVerifiedAt: null,
        mismatchCount: 0,
        registeredDescriptor: null,
        isScreenSharing: false,
    });

    const registerFace = useCallback(async (descriptor: Float32Array, candidateId: string): Promise<boolean> => {
        try {
            setState(prev => ({ ...prev, verificationStatus: 'pending' }));

            const descriptorArray = Array.from(descriptor);

            const response = await api.post(API_ENDPOINTS.FACE.REGISTER, {
                candidateId,
                descriptor: descriptorArray,
            });

            if (response.data.success) {
                setState(prev => ({
                    ...prev,
                    isRegistered: true,
                    verificationStatus: 'verified',
                    registeredDescriptor: descriptorArray,
                    lastVerifiedAt: new Date(),
                }));
                return true;
            }

            setState(prev => ({ ...prev, verificationStatus: 'failed' }));
            return false;
        } catch (error) {
            console.error('Face registration error:', error);
            setState(prev => ({ ...prev, verificationStatus: 'failed' }));
            return false;
        }
    }, []);

    const verifyFace = useCallback(async (
        descriptor: Float32Array,
        candidateId: string
    ): Promise<{ verified: boolean; distance: number }> => {
        try {
            setState(prev => ({ ...prev, verificationStatus: 'pending' }));

            const descriptorArray = Array.from(descriptor);

            const response = await api.post(API_ENDPOINTS.FACE.VERIFY, {
                candidateId,
                descriptor: descriptorArray,
            });

            const { verified, distance } = response.data;

            if (verified) {
                setState(prev => ({
                    ...prev,
                    verificationStatus: 'verified',
                    lastVerifiedAt: new Date(),
                    mismatchCount: 0,
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    verificationStatus: 'mismatch',
                    mismatchCount: prev.mismatchCount + 1,
                }));
            }

            return { verified, distance };
        } catch (error) {
            console.error('Face verification error:', error);
            setState(prev => ({ ...prev, verificationStatus: 'failed' }));
            return { verified: false, distance: -1 };
        }
    }, []);

    const resetVerification = useCallback(() => {
        setState({
            isRegistered: false,
            verificationStatus: 'idle',
            lastVerifiedAt: null,
            mismatchCount: 0,
            registeredDescriptor: null,
            isScreenSharing: false,
        });
    }, []);

    const incrementMismatchCount = useCallback(() => {
        setState(prev => ({
            ...prev,
            mismatchCount: prev.mismatchCount + 1,
        }));
    }, []);

    const setScreenSharing = useCallback((isSharing: boolean) => {
        setState(prev => ({
            ...prev,
            isScreenSharing: isSharing,
        }));
    }, []);

    const value = React.useMemo(() => ({
        ...state,
        registerFace,
        verifyFace,
        resetVerification,
        incrementMismatchCount,
        setScreenSharing,
    }), [state, registerFace, verifyFace, resetVerification, incrementMismatchCount, setScreenSharing]);

    return (
        <FaceVerificationContext.Provider value={value}>
            {children}
        </FaceVerificationContext.Provider>
    );
};

export const useFaceVerification = () => {
    const context = useContext(FaceVerificationContext);
    if (context === undefined) {
        throw new Error('useFaceVerification must be used within a FaceVerificationProvider');
    }
    return context;
};
