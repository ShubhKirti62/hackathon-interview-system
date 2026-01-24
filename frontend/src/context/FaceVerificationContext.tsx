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
}

interface FaceVerificationContextType extends FaceVerificationState {
    registerFace: (descriptor: Float32Array, candidateId: string) => Promise<boolean>;
    verifyFace: (descriptor: Float32Array, candidateId: string) => Promise<{ verified: boolean; distance: number }>;
    resetVerification: () => void;
    incrementMismatchCount: () => void;
}

const FaceVerificationContext = createContext<FaceVerificationContextType | undefined>(undefined);

export const FaceVerificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<FaceVerificationState>({
        isRegistered: false,
        verificationStatus: 'idle',
        lastVerifiedAt: null,
        mismatchCount: 0,
        registeredDescriptor: null,
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
        });
    }, []);

    const incrementMismatchCount = useCallback(() => {
        setState(prev => ({
            ...prev,
            mismatchCount: prev.mismatchCount + 1,
        }));
    }, []);

    return (
        <FaceVerificationContext.Provider
            value={{
                ...state,
                registerFace,
                verifyFace,
                resetVerification,
                incrementMismatchCount,
            }}
        >
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
