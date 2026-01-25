import React, { useEffect, useState, useCallback } from 'react';
import { Camera, CheckCircle, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import useFaceDetection from '../hooks/useFaceDetection';
import { useFaceVerification } from '../context/FaceVerificationContext';

interface FaceCaptureProps {
    candidateId: string;
    onCaptureComplete: (success: boolean) => void;
    onSkip?: () => void;
}

const FaceCapture: React.FC<FaceCaptureProps> = ({ candidateId, onCaptureComplete, onSkip }) => {
    const {
        videoRef,
        canvasRef,
        faceDetected,
        error,
        loadModels,
        startCamera,
        stopCamera,
        captureFaceDescriptor,
        startDetection,
        stopDetection,
    } = useFaceDetection({ minConfidence: 0.3, detectionInterval: 300 });

    const { registerFace, verificationStatus } = useFaceVerification();

    const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'capturing' | 'success' | 'error'>('idle');
    const [countdown, setCountdown] = useState<number | null>(null);
    const [message, setMessage] = useState('Click "Start Video" to begin face registration');

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopDetection();
            stopCamera();
        };
    }, [stopDetection, stopCamera]);

    // Start video handler
    const handleStartVideo = useCallback(async () => {
        setStatus('loading');
        setMessage('Loading face detection models...');

        const modelsLoaded = await loadModels();
        if (!modelsLoaded) {
            setStatus('error');
            setMessage('Failed to load face detection models');
            return;
        }

        setMessage('Starting camera...');
        const cameraStarted = await startCamera();
        if (!cameraStarted) {
            setStatus('error');
            setMessage('Failed to access camera. Please allow camera permissions.');
            return;
        }

        setStatus('ready');
        setMessage('Position your face in the center of the frame');
        startDetection();
    }, [loadModels, startCamera, startDetection]);

    // Handle capture with countdown
    const handleCapture = useCallback(async () => {
        if (!faceDetected) {
            setMessage('No face detected. Please position your face in the frame.');
            return;
        }

        setStatus('capturing');
        setCountdown(3);
        setMessage('Hold still...');

        // Countdown
        for (let i = 3; i > 0; i--) {
            setCountdown(i);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setCountdown(null);

        // Capture face descriptor
        const descriptor = await captureFaceDescriptor();
        if (!descriptor) {
            setStatus('ready');
            setMessage('Failed to capture face. Please try again.');
            return;
        }

        // Register face with backend
        setMessage('Registering your face...');
        const success = await registerFace(descriptor, candidateId);

        if (success) {
            setStatus('success');
            setMessage('Face registered successfully!');
            setTimeout(() => onCaptureComplete(true), 1500);
        } else {
            setStatus('error');
            setMessage('Failed to register face. Please try again.');
        }
    }, [faceDetected, captureFaceDescriptor, registerFace, candidateId, onCaptureComplete]);

    const handleRetry = useCallback(async () => {
        setStatus('loading');
        setMessage('Restarting camera...');
        stopDetection();
        stopCamera();

        const cameraStarted = await startCamera();
        if (cameraStarted) {
            setStatus('ready');
            setMessage('Position your face in the center of the frame');
            startDetection();
        } else {
            setStatus('error');
            setMessage('Failed to restart camera');
        }
    }, [startCamera, stopCamera, startDetection, stopDetection]);

    return (
        <div className="face-capture-container">
            <div className="face-capture-header">
                <Camera size={24} />
                <h2>Face Registration</h2>
            </div>

            <p className="face-capture-description">
                We'll capture your face to verify your identity during the interview.
                This helps ensure a fair and secure interview process.
            </p>

            <div className="face-capture-video-container">
                {status === 'idle' && (
                    <div className="face-capture-placeholder">
                        <Camera size={64} className="placeholder-icon" />
                        <p>Camera preview will appear here</p>
                    </div>
                )}

                {status === 'loading' && (
                    <div className="face-capture-placeholder">
                        <Loader size={64} className="spin" />
                        <p>{message}</p>
                    </div>
                )}

                {/* Always render video/canvas for ref attachment */}
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="face-capture-video"
                    style={{ display: (status !== 'idle' && status !== 'loading') ? 'block' : 'none' }}
                />
                <canvas
                    ref={canvasRef}
                    className="face-capture-canvas"
                    style={{ display: (status !== 'idle' && status !== 'loading') ? 'block' : 'none' }}
                />

                {countdown !== null && (
                    <div className="face-capture-countdown">
                        {countdown}
                    </div>
                )}

                {status === 'success' && (
                    <div className="face-capture-overlay success">
                        <CheckCircle size={64} />
                    </div>
                )}

                {faceDetected && status === 'ready' && (
                    <div className="face-capture-indicator detected">
                        Face Detected
                    </div>
                )}

                {!faceDetected && status === 'ready' && (
                    <div className="face-capture-indicator not-detected">
                        No Face Detected
                    </div>
                )}
            </div>

            <div className="face-capture-status">
                {status === 'loading' && <Loader className="spin" size={20} />}
                {status === 'error' && <AlertCircle size={20} color="var(--error)" />}
                {status === 'success' && <CheckCircle size={20} color="var(--success)" />}
                <span className={`status-message ${status}`}>{message}</span>
            </div>

            {error && (
                <div className="face-capture-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="face-capture-actions">
                {status === 'idle' && (
                    <button className="btn btn-primary" onClick={handleStartVideo}>
                        <Camera size={18} />
                        Start Video
                    </button>
                )}

                {status === 'error' && (
                    <button className="btn btn-secondary" onClick={handleRetry}>
                        <RefreshCw size={18} />
                        Retry
                    </button>
                )}

                {(status === 'ready' || status === 'capturing') && (
                    <button
                        className="btn btn-primary"
                        onClick={handleCapture}
                        disabled={!faceDetected || status === 'capturing' || verificationStatus === 'pending'}
                    >
                        {status === 'capturing' ? (
                            <>
                                <Loader className="spin" size={18} />
                                Capturing...
                            </>
                        ) : (
                            <>
                                <Camera size={18} />
                                Capture Face
                            </>
                        )}
                    </button>
                )}

                {onSkip && status !== 'success' && (
                    <button className="btn btn-ghost" onClick={onSkip}>
                        Skip for now
                    </button>
                )}
            </div>
        </div>
    );
};

export default FaceCapture;
