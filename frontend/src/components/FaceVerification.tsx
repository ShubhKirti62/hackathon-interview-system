import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Camera, Loader, Video, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/endpoints';

interface FaceVerificationProps {
    candidateId: string;
}

const REFERENCE_COUNT = 3;
const SIMILARITY_THRESHOLD = 0.7; // 70% similarity required

const FaceVerification: React.FC<FaceVerificationProps> = ({ candidateId }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const screenshotTimerRef = useRef<number | null>(null);
    const verificationTimerRef = useRef<number | null>(null);
    const referenceImages = useRef<ImageData[]>([]);

    const [videoStatus, setVideoStatus] = useState<'idle' | 'loading' | 'capturing' | 'active'>('idle');
    const [message, setMessage] = useState('Click "Start Video" to begin');
    const [captureProgress, setCaptureProgress] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [mismatchCount, setMismatchCount] = useState(0);

    // Capture image from video (small size for comparison)
    const captureVideoFrame = useCallback((): ImageData | null => {
        if (!videoRef.current || videoRef.current.readyState < 2) return null;

        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(videoRef.current, 0, 0, 160, 120);
        return ctx.getImageData(0, 0, 160, 120);
    }, []);

    // Compare two images - returns similarity score 0-1
    const compareImages = (img1: ImageData, img2: ImageData): number => {
        const data1 = img1.data;
        const data2 = img2.data;
        let matchingPixels = 0;
        const totalPixels = data1.length / 4;

        for (let i = 0; i < data1.length; i += 4) {
            const r1 = data1[i], g1 = data1[i + 1], b1 = data1[i + 2];
            const r2 = data2[i], g2 = data2[i + 1], b2 = data2[i + 2];

            const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
            if (diff < 100) {
                matchingPixels++;
            }
        }

        return matchingPixels / totalPixels;
    };

    // Capture and save full screen screenshot
    const captureScreenshot = useCallback(async (type: string = 'screen') => {
        // Try to capture from screen stream first
        if (screenStreamRef.current) {
            try {
                const track = screenStreamRef.current.getVideoTracks()[0];
                if (track && track.readyState === 'live') {
                    // Create a video element to capture from screen stream
                    const screenVideo = document.createElement('video');
                    screenVideo.srcObject = screenStreamRef.current;
                    screenVideo.muted = true;

                    await new Promise<void>((resolve) => {
                        screenVideo.onloadedmetadata = () => {
                            screenVideo.play().then(() => resolve());
                        };
                    });

                    // Wait a bit for the video to be ready
                    await new Promise(resolve => setTimeout(resolve, 100));

                    const canvas = document.createElement('canvas');
                    canvas.width = screenVideo.videoWidth;
                    canvas.height = screenVideo.videoHeight;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    ctx.drawImage(screenVideo, 0, 0);
                    const imageData = canvas.toDataURL('image/png');

                    screenVideo.pause();
                    screenVideo.srcObject = null;

                    const response = await api.post(API_ENDPOINTS.FACE.SCREENSHOT, {
                        candidateId: candidateId || 'unknown',
                        image: imageData,
                        type: type,
                    });
                    console.log('Full screen screenshot saved to DB:', response.data);
                    return;
                }
            } catch (error) {
                console.error('Screen capture error, falling back to video:', error);
            }
        }

        // Fallback to webcam if screen capture is not available
        if (!videoRef.current || videoRef.current.readyState < 2) {
            console.log('No capture source available');
            return;
        }

        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(videoRef.current, 0, 0);
            const imageData = canvas.toDataURL('image/png');

            const response = await api.post(API_ENDPOINTS.FACE.SCREENSHOT, {
                candidateId: candidateId || 'unknown',
                image: imageData,
                type: 'video',
            });
            console.log('Webcam screenshot saved to DB (fallback):', response.data);
        } catch (error) {
            console.error('Screenshot error:', error);
        }
    }, [candidateId]);

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            });
            cameraStreamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await new Promise<void>((resolve) => {
                    videoRef.current!.onloadedmetadata = () => resolve();
                });
                await videoRef.current.play();
            }
            return true;
        } catch (error) {
            console.error('Camera error:', error);
            return false;
        }
    }, []);

    // Initialize screen capture for full screen screenshots
    const initScreenCapture = useCallback(async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { displaySurface: 'monitor' },
                audio: false,
            });
            screenStreamRef.current = screenStream;

            // Handle when user stops sharing
            screenStream.getVideoTracks()[0].onended = () => {
                console.log('Screen sharing stopped by user');
                screenStreamRef.current = null;
            };

            console.log('Screen capture initialized');
            return true;
        } catch (error) {
            console.error('Screen capture error:', error);
            return false;
        }
    }, []);

    // Capture reference images
    const captureReferenceImages = useCallback(async () => {
        setVideoStatus('capturing');
        setMessage('Capturing reference images...');
        referenceImages.current = [];
        setCaptureProgress(0);

        for (let i = 0; i < REFERENCE_COUNT; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500));

            const frame = captureVideoFrame();
            if (frame) {
                referenceImages.current.push(frame);
                setCaptureProgress(i + 1);
                setMessage(`Captured ${i + 1}/${REFERENCE_COUNT} reference images`);
                console.log(`Reference ${i + 1} captured`);
            } else {
                i--;
                setMessage('Please stay in front of camera...');
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        console.log('All reference images captured:', referenceImages.current.length);
        setMessage('Monitoring active');
        setVideoStatus('active');
    }, [captureVideoFrame]);

    // Verify current frame against references
    const verifyCurrentFrame = useCallback(() => {
        if (referenceImages.current.length === 0) return;

        const currentFrame = captureVideoFrame();
        if (!currentFrame) {
            console.log('Could not capture current frame');
            return;
        }

        let bestSimilarity = 0;
        for (const refImage of referenceImages.current) {
            const similarity = compareImages(currentFrame, refImage);
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
            }
        }

        console.log('Similarity:', (bestSimilarity * 100).toFixed(1) + '%', 'Threshold:', (SIMILARITY_THRESHOLD * 100) + '%');

        if (bestSimilarity < SIMILARITY_THRESHOLD) {
            console.log('>>> MISMATCH DETECTED! <<<');
            setMismatchCount(prev => {
                const newCount = prev + 1;
                console.log('Mismatch count:', newCount);
                if (newCount >= 2) {
                    setWarningMessage('🚨 WARNING: Image mismatch detected! The current video does not match the reference. This incident has been recorded.');
                    setShowWarning(true);
                    captureScreenshot('mismatch');
                }
                return newCount;
            });
        } else {
            console.log('Image matched!');
            setMismatchCount(0);
        }
    }, [captureVideoFrame, captureScreenshot]);

    // Schedule random screenshots
    const scheduleNextScreenshot = useCallback(() => {
        const minDelay = 10000;
        const maxDelay = 30000;
        const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

        screenshotTimerRef.current = window.setTimeout(async () => {
            await captureScreenshot('screen');
            scheduleNextScreenshot();
        }, randomDelay);
    }, [captureScreenshot]);

    // Start verification loop
    const startVerificationLoop = useCallback(() => {
        console.log('Starting verification loop');
        verificationTimerRef.current = window.setInterval(() => {
            verifyCurrentFrame();
        }, 3000);
    }, [verifyCurrentFrame]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (cameraStreamRef.current) {
                cameraStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (screenshotTimerRef.current) {
                clearTimeout(screenshotTimerRef.current);
            }
            if (verificationTimerRef.current) {
                clearInterval(verificationTimerRef.current);
            }
        };
    }, []);

    // Start video handler
    const handleStartVideo = useCallback(async () => {
        setVideoStatus('loading');
        setMessage('Starting camera...');

        const cameraStarted = await startCamera();
        if (!cameraStarted) {
            setVideoStatus('idle');
            setMessage('Failed to start camera');
            return;
        }

        // Initialize screen capture for full screen screenshots
        setMessage('Please select screen to share for monitoring...');
        const screenStarted = await initScreenCapture();
        if (!screenStarted) {
            console.log('Screen capture not enabled, will use webcam for screenshots');
        }

        await captureReferenceImages();

        setMessage('Monitoring active');
        scheduleNextScreenshot();
        startVerificationLoop();
    }, [startCamera, initScreenCapture, captureReferenceImages, scheduleNextScreenshot, startVerificationLoop]);

    // Dismiss warning
    const dismissWarning = () => {
        setShowWarning(false);
        setMismatchCount(0);
    };

    return (
        <>
            {/* Warning Popup */}
            {showWarning && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999
                }}>
                    <div style={{
                        backgroundColor: '#1e1e2e',
                        padding: '2.5rem',
                        borderRadius: '1rem',
                        maxWidth: '500px',
                        textAlign: 'center',
                        border: '4px solid #ef4444',
                        boxShadow: '0 0 50px rgba(239, 68, 68, 0.6)',
                        animation: 'pulse 1s infinite'
                    }}>
                        <AlertTriangle size={80} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
                        <h2 style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '1.75rem', fontWeight: 'bold' }}>
                            ⚠️ WARNING!
                        </h2>
                        <p style={{ color: '#ffffff', marginBottom: '2rem', fontSize: '1.1rem', lineHeight: '1.7' }}>
                            {warningMessage}
                        </p>
                        <button
                            onClick={dismissWarning}
                            style={{
                                padding: '1rem 2.5rem',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            I Understand
                        </button>
                    </div>
                </div>
            )}

            <div className="face-verification-panel">
                <div className="face-verification-header">
                    <div className="face-verification-title">
                        <Video size={20} />
                        <span>Video Monitor</span>
                    </div>
                    {videoStatus === 'active' && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            color: mismatchCount > 0 ? '#ef4444' : '#22c55e'
                        }}>
                            <span style={{
                                width: '10px', height: '10px',
                                borderRadius: '50%',
                                backgroundColor: mismatchCount > 0 ? '#ef4444' : '#22c55e'
                            }} />
                            {mismatchCount > 0 ? `⚠️ Alert (${mismatchCount})` : '✓ Verified'}
                        </div>
                    )}
                </div>

                <div className="face-verification-video-wrapper">
                    {videoStatus === 'idle' && (
                        <div className="face-verification-placeholder">
                            <Camera size={48} className="placeholder-icon" />
                            <p>Camera preview will appear here</p>
                            <button className="btn btn-primary" onClick={handleStartVideo}>
                                <Camera size={18} />
                                Start Video
                            </button>
                        </div>
                    )}

                    {videoStatus === 'loading' && (
                        <div className="face-verification-placeholder">
                            <Loader size={48} className="spin" />
                            <p>{message}</p>
                        </div>
                    )}

                    {videoStatus === 'capturing' && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.8)', zIndex: 10,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: '1rem'
                        }}>
                            <Camera size={48} color="#3b82f6" />
                            <p style={{ color: 'white', fontWeight: 'bold' }}>{message}</p>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                {Array.from({ length: REFERENCE_COUNT }).map((_, i) => (
                                    <div key={i} style={{
                                        width: '24px', height: '24px', borderRadius: '50%',
                                        backgroundColor: i < captureProgress ? '#22c55e' : '#374151',
                                        border: '3px solid #3b82f6',
                                        transition: 'all 0.3s'
                                    }} />
                                ))}
                            </div>
                            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Please stay in front of camera</p>
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="face-verification-video"
                        style={{ display: ['capturing', 'active'].includes(videoStatus) ? 'block' : 'none' }}
                    />
                </div>

                {videoStatus === 'active' && (
                    <div className="face-verification-status">
                        <span className="status-text">{message}</span>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}</style>
        </>
    );
};

export default FaceVerification;
