import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, CheckCircle, AlertTriangle, Loader } from 'lucide-react';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/endpoints';
import { showToast } from '../utils/toast';

interface FaceRegistrationProps {
    candidateId: string;
    onSuccess: () => void;
    onClose: () => void;
}

const FaceRegistration: React.FC<FaceRegistrationProps> = ({ candidateId, onSuccess, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [initializing, setInitializing] = useState(true);
    const [detecting, setDetecting] = useState(false);
    const [error, setError] = useState('');
    const [faceDetected, setFaceDetected] = useState(false);
    
    // Load models
    useEffect(() => {
        const loadModels = async () => {
            try {
                const MODEL_URL = '/models';
                await Promise.all([
                    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                startVideo();
            } catch (err) {
                console.error('Failed to load face-api models', err);
                setError('Failed to load face recognition models. Please refresh and try again.');
                setInitializing(false);
            }
        };
        loadModels();
    }, []);

    const startVideo = () => {
        navigator.mediaDevices
            .getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
            .then((stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                setInitializing(false);
            })
            .catch((err) => {
                console.error(err);
                setError('Unable to access camera. Please allow camera permissions.');
                setInitializing(false);
            });
    };

    const handleVideoPlay = () => {
        const interval = setInterval(async () => {
            if (videoRef.current && canvasRef.current && !detecting) {
                const displaySize = { 
                    width: videoRef.current.videoWidth, 
                    height: videoRef.current.videoHeight 
                };
                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi.detectAllFaces(
                    videoRef.current, 
                    new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
                ).withFaceLandmarks().withFaceDescriptors();

                if (detections.length > 0) {
                    setFaceDetected(true);
                    // Draw box
                    const resizedDetections = faceapi.resizeResults(detections, displaySize);
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
                    }
                } else {
                    setFaceDetected(false);
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
            }
        }, 500);
        return () => clearInterval(interval);
    };

    const captureAndRegister = async () => {
        if (!videoRef.current || !faceDetected) return;

        setDetecting(true);
        try {
            // Get the single best face with descriptor
            const detection = await faceapi.detectSingleFace(
                videoRef.current,
                new faceapi.SsdMobilenetv1Options({ minConfidence: 0.8 })
            ).withFaceLandmarks().withFaceDescriptor();

            if (!detection) {
                throw new Error('No face detected clearly. Please stay steady.');
            }

            const descriptor = Array.from(detection.descriptor); // Convert Float32Array to normal array

            // Send to backend
            await api.post(API_ENDPOINTS.FACE.REGISTER, {
                candidateId,
                descriptor
            });

            showToast.success('Face registered successfully!');
            onSuccess();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Registration failed');
            setDetecting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Setup Face Verification</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {error && (
                        <div style={{ 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', 
                            padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', width: '100%',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}>
                            <AlertTriangle size={18} /> {error}
                        </div>
                    )}

                    <div style={{ position: 'relative', width: '100%', maxWidth: '480px', aspectRatio: '4/3', backgroundColor: 'black', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
                        {initializing && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexDirection: 'column', gap: '1rem' }}>
                                <Loader className="animate-spin" size={32} />
                                <div>Loading AI Models...</div>
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            onPlay={handleVideoPlay}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
                        
                        {!initializing && !detecting && (
                            <div style={{ 
                                position: 'absolute', bottom: '1rem', left: '0', right: '0', 
                                textAlign: 'center', color: faceDetected ? 'var(--success)' : 'var(--warning)',
                                textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontWeight: 'bold'
                            }}>
                                {faceDetected ? 'Face Detected - Ready to Capture' : 'Position your face in the frame'}
                            </div>
                        )}
                    </div>

                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            We need to register your face to verify your identity during the interview. 
                            Please ensure you are in a well-lit environment and look directly at the camera.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn" onClick={onClose} disabled={detecting}>Cancel</button>
                            <button 
                                className="btn btn-primary" 
                                onClick={captureAndRegister} 
                                disabled={initializing || !faceDetected || detecting}
                                style={{ minWidth: '160px' }}
                            >
                                {detecting ? (
                                    <>
                                        <Loader className="animate-spin" size={16} style={{ marginRight: '0.5rem' }} /> Processing...
                                    </>
                                ) : (
                                    <>
                                        <Camera size={18} style={{ marginRight: '0.5rem' }} /> Register Face
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FaceRegistration;
