import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Eye, EyeOff } from 'lucide-react';
import useFaceDetection from '../hooks/useFaceDetection';
import { useFaceVerification } from '../context/FaceVerificationContext';
import type { VerificationStatus } from '../context/FaceVerificationContext';

interface FaceVerificationProps {
    candidateId: string;
    verificationInterval?: number; // How often to verify (ms)
    maxMismatches?: number; // Max allowed mismatches before alert
    onVerificationChange?: (status: VerificationStatus) => void;
    onMaxMismatchesReached?: () => void;
    minimized?: boolean;
}

const FaceVerification: React.FC<FaceVerificationProps> = ({
    candidateId,
    verificationInterval = 10000, // Verify every 10 seconds
    maxMismatches = 3,
    onVerificationChange,
    onMaxMismatchesReached,
    minimized = false,
}) => {
    const {
        videoRef,
        canvasRef,
        isModelLoaded,
        faceDetected,
        loadModels,
        startCamera,
        stopCamera,
        captureFaceDescriptor,
        startDetection,
        stopDetection,
    } = useFaceDetection({ minConfidence: 0.5, detectionInterval: 500 });

    const { verifyFace, verificationStatus, mismatchCount } = useFaceVerification();

    const [isMinimized, setIsMinimized] = useState(minimized);
    const [lastVerification, setLastVerification] = useState<Date | null>(null);
    const [verificationMessage, setVerificationMessage] = useState('Initializing...');
    const verificationTimerRef = useRef<number | null>(null);

    // Initialize
    useEffect(() => {
        const initialize = async () => {
            await loadModels();
            await startCamera();
            startDetection();
        };

        initialize();

        return () => {
            stopDetection();
            stopCamera();
            if (verificationTimerRef.current) {
                clearInterval(verificationTimerRef.current);
            }
        };
    }, [loadModels, startCamera, stopCamera, startDetection, stopDetection]);

    // Periodic verification
    const performVerification = useCallback(async () => {
        if (!isModelLoaded || !faceDetected) {
            if (!faceDetected) {
                setVerificationMessage('No face detected');
            }
            return;
        }

        const descriptor = await captureFaceDescriptor();
        if (!descriptor) {
            setVerificationMessage('Could not capture face');
            return;
        }

        const result = await verifyFace(descriptor, candidateId);
        setLastVerification(new Date());

        if (result.verified) {
            setVerificationMessage('Identity verified');
        } else {
            setVerificationMessage(`Face mismatch detected (${mismatchCount + 1}/${maxMismatches})`);
        }
    }, [isModelLoaded, faceDetected, captureFaceDescriptor, verifyFace, candidateId, mismatchCount, maxMismatches]);

    // Start periodic verification timer
    useEffect(() => {
        if (isModelLoaded) {
            // Initial verification after 2 seconds
            const initialTimer = setTimeout(() => {
                performVerification();
            }, 2000);

            // Periodic verification
            verificationTimerRef.current = window.setInterval(() => {
                performVerification();
            }, verificationInterval);

            return () => {
                clearTimeout(initialTimer);
                if (verificationTimerRef.current) {
                    clearInterval(verificationTimerRef.current);
                }
            };
        }
    }, [isModelLoaded, performVerification, verificationInterval]);

    // Notify parent of status changes
    useEffect(() => {
        onVerificationChange?.(verificationStatus);
    }, [verificationStatus, onVerificationChange]);

    // Check for max mismatches
    useEffect(() => {
        if (mismatchCount >= maxMismatches) {
            onMaxMismatchesReached?.();
        }
    }, [mismatchCount, maxMismatches, onMaxMismatchesReached]);

    const getStatusIcon = () => {
        switch (verificationStatus) {
            case 'verified':
                return <ShieldCheck size={20} color="var(--success)" />;
            case 'mismatch':
                return <ShieldAlert size={20} color="var(--warning)" />;
            case 'failed':
                return <ShieldX size={20} color="var(--error)" />;
            default:
                return <ShieldCheck size={20} color="var(--text-secondary)" />;
        }
    };

    const getStatusClass = () => {
        switch (verificationStatus) {
            case 'verified':
                return 'verified';
            case 'mismatch':
                return 'mismatch';
            case 'failed':
                return 'failed';
            default:
                return 'pending';
        }
    };

    if (isMinimized) {
        return (
            <div className={`face-verification-minimized ${getStatusClass()}`}>
                <button
                    className="face-verification-expand-btn"
                    onClick={() => setIsMinimized(false)}
                    title="Expand verification panel"
                >
                    {getStatusIcon()}
                    <Eye size={16} />
                </button>
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="face-verification-mini-video"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
        );
    }

    return (
        <div className={`face-verification-panel ${getStatusClass()}`}>
            <div className="face-verification-header">
                <div className="face-verification-title">
                    {getStatusIcon()}
                    <span>Identity Verification</span>
                </div>
                <button
                    className="face-verification-minimize-btn"
                    onClick={() => setIsMinimized(true)}
                    title="Minimize"
                >
                    <EyeOff size={16} />
                </button>
            </div>

            <div className="face-verification-video-wrapper">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="face-verification-video"
                />
                <canvas
                    ref={canvasRef}
                    className="face-verification-canvas"
                />

                {!faceDetected && (
                    <div className="face-verification-warning">
                        <ShieldAlert size={24} />
                        <span>Face not visible</span>
                    </div>
                )}
            </div>

            <div className={`face-verification-status ${getStatusClass()}`}>
                <span className="status-text">{verificationMessage}</span>
                {lastVerification && (
                    <span className="last-verified">
                        Last checked: {lastVerification.toLocaleTimeString()}
                    </span>
                )}
            </div>

            {mismatchCount > 0 && (
                <div className="face-verification-mismatch-warning">
                    <ShieldAlert size={16} />
                    <span>
                        {mismatchCount} mismatch{mismatchCount > 1 ? 'es' : ''} detected
                        {mismatchCount >= maxMismatches && ' - HR has been notified'}
                    </span>
                </div>
            )}
        </div>
    );
};

export default FaceVerification;
