import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Video, Monitor, Shield, AlertTriangle } from 'lucide-react';
import * as faceapi from 'face-api.js';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/endpoints';
import { useFaceVerification } from '../context/FaceVerificationContext';

interface FaceVerificationProps {
    candidateId: string;
    interviewId?: string;
}

const PROXY_CHECK_INTERVAL = 90000; // 90 seconds

const FaceVerification: React.FC<FaceVerificationProps> = ({ candidateId, interviewId }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const proxyIntervalRef = useRef<number | null>(null);
    const modelsLoadedRef = useRef(false);
    const { setScreenSharing } = useFaceVerification();

    // Status states
    const [cameraStatus, setCameraStatus] = useState<'loading' | 'active' | 'error'>('loading');
    const [screenStatus, setScreenStatus] = useState<'idle' | 'active' | 'error'>('idle');
    const [message, setMessage] = useState('Initializing Proctoring...');
    const [proxyStatus, setProxyStatus] = useState<'idle' | 'ok' | 'warning' | 'critical'>('idle');

    // Drag logic
    const panelRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
    const dragRef = useRef<{ startX: number; startY: number; elX: number; elY: number } | null>(null);

    const onDragStart = useCallback((clientX: number, clientY: number) => {
        if (!panelRef.current) return;
        const rect = panelRef.current.getBoundingClientRect();
        const cur = pos || { x: rect.left, y: rect.top };
        dragRef.current = { startX: clientX, startY: clientY, elX: cur.x, elY: cur.y };
        const onMove = (mx: number, my: number) => {
            if (!dragRef.current || !panelRef.current) return;
            const r = panelRef.current.getBoundingClientRect();
            const nx = Math.max(0, Math.min(window.innerWidth - r.width, dragRef.current.elX + mx - dragRef.current.startX));
            const ny = Math.max(0, Math.min(window.innerHeight - r.height, dragRef.current.elY + my - dragRef.current.startY));
            setPos({ x: nx, y: ny });
        };
        const handleMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
        const handleTouchMove = (e: TouchEvent) => onMove(e.touches[0].clientX, e.touches[0].clientY);
        const handleEnd = () => {
            dragRef.current = null;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleEnd);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
    }, [pos]);

    const dragProps = {
        onMouseDown: (e: React.MouseEvent) => { e.preventDefault(); onDragStart(e.clientX, e.clientY); },
        onTouchStart: (e: React.TouchEvent) => { onDragStart(e.touches[0].clientX, e.touches[0].clientY); },
    };

    const posStyle: React.CSSProperties = pos
        ? { left: pos.x, top: pos.y, bottom: 'auto', right: 'auto' }
        : {};

    // Load face-api models for proxy checking
    const loadFaceModels = async () => {
        if (modelsLoadedRef.current) return true;
        try {
            const MODEL_URL = '/models';
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
            modelsLoadedRef.current = true;
            return true;
        } catch (err) {
            console.error('Failed to load face-api models for proxy check:', err);
            return false;
        }
    };

    // Perform a proxy check by extracting descriptor from video and sending to backend
    const performProxyCheck = async () => {
        try {
            if (!videoRef.current || !modelsLoadedRef.current) return;
            if (videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0) return;

            const detection = await faceapi
                .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                // No face detected - skip this check
                return;
            }

            const descriptor = Array.from(detection.descriptor);

            const res = await api.post(API_ENDPOINTS.FACE.PROXY_CHECK, {
                candidateId,
                descriptor,
                interviewId,
            });

            const { status } = res.data;
            if (status === 'ok') {
                setProxyStatus('ok');
            } else if (status === 'face_inconsistency') {
                setProxyStatus('warning');
            } else if (status === 'proxy_detected') {
                setProxyStatus('critical');
            }
        } catch (err) {
            console.error('Proxy check error:', err);
        }
    };

    // 1. Start Camera (Mandatory)
    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                });

                cameraStreamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current!.play().catch(e => console.log("Play error", e));
                    };
                }
                setCameraStatus('active');

                // Load face-api models and start proxy check interval
                const modelsOk = await loadFaceModels();
                if (modelsOk) {
                    // Delay first check to let video stabilize
                    setTimeout(() => performProxyCheck(), 10000);
                    proxyIntervalRef.current = window.setInterval(performProxyCheck, PROXY_CHECK_INTERVAL);
                }
            } catch (err) {
                console.error('Camera error', err);
                setCameraStatus('error');
                setMessage('Camera access required for test.');
            }
        };

        startCamera();

        return () => {
            if (cameraStreamRef.current) {
                cameraStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (proxyIntervalRef.current) {
                clearInterval(proxyIntervalRef.current);
                proxyIntervalRef.current = null;
            }
        };
    }, []);

    // Re-attach stream when video element might have been re-created (e.g. view switch)
    useEffect(() => {
        if (videoRef.current && cameraStreamRef.current) {
            videoRef.current.srcObject = cameraStreamRef.current;
            videoRef.current.play().catch(e => console.log("Re-attach play error", e));
        }
    }, [screenStatus, cameraStatus]);

    // 2. Start Screen Share (Mandatory for "Screen recording")
    const startScreenShare = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'monitor'
                },
                audio: false
            });

            screenStreamRef.current = stream;
            setScreenStatus('active');
            setMessage('Monitoring Active: Camera & Screen');

            // Update global screen sharing status
            setScreenSharing(true);

            // Handle user stopping share
            stream.getVideoTracks()[0].onended = () => {
                setScreenStatus('idle');
                setMessage('Screen sharing stopped. Please re-enable.');
                setScreenSharing(false);
            };

            // Start Monitoring Loop
            scheduleNextScreenshot();

        } catch (err) {
            console.error('Screen share error', err);
            setScreenStatus('error');
            setMessage('Screen sharing required for test.');
        }
    };

    // 3. Random Screenshot Capture (Screen + Camera optional)
    const captureScreenshot = async (type: 'screen' | 'video' = 'screen') => {
        try {
            let stream = type === 'screen' ? screenStreamRef.current : cameraStreamRef.current;

            if (type === 'screen' && (!stream || !stream.active)) return;
            if (type === 'video' && (!videoRef.current)) return;

            const videoTrack = stream?.getVideoTracks()[0];
            if (!videoTrack) return;

            const captureCanvas = document.createElement('canvas');
            const { width, height } = videoTrack.getSettings();
            captureCanvas.width = width || 1920;
            captureCanvas.height = height || 1080;

            const ctx = captureCanvas.getContext('2d');
            if (ctx) {
                if (type === 'video' && videoRef.current) {
                    ctx.drawImage(videoRef.current, 0, 0);
                } else if (type === 'screen' && stream) {
                    const tempVideo = document.createElement('video');
                    tempVideo.srcObject = stream;
                    tempVideo.muted = true;
                    await tempVideo.play();
                    ctx.drawImage(tempVideo, 0, 0);
                    tempVideo.pause();
                    tempVideo.srcObject = null;
                }

                const image = captureCanvas.toDataURL('image/png');

                await api.post(API_ENDPOINTS.FACE.SCREENSHOT, {
                    candidateId,
                    image,
                    type
                });
                console.log(`Random ${type} screenshot captured`);
            }
        } catch (err) {
            console.error('Screenshot capture error:', err);
        }
    };

    const scheduleNextScreenshot = () => {
        const delay = 60000;

        setTimeout(async () => {
            if (screenStreamRef.current?.active) {
                await captureScreenshot('screen');
                scheduleNextScreenshot();
            }
        }, delay);
    };

    // Cleanup Screen
    useEffect(() => {
        return () => {
            if (screenStreamRef.current) {
                const tracks = screenStreamRef.current.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    // Proxy status indicator
    const getProxyIndicator = () => {
        if (proxyStatus === 'idle') return null;

        const colors: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
            ok: { bg: '#10B981', border: '#059669', icon: <Shield size={10} /> },
            warning: { bg: '#F59E0B', border: '#D97706', icon: <AlertTriangle size={10} /> },
            critical: { bg: '#EF4444', border: '#DC2626', icon: <AlertTriangle size={10} /> },
        };

        const c = colors[proxyStatus];
        if (!c) return null;

        return (
            <div style={{
                position: 'absolute', top: '4px', right: '4px',
                width: '20px', height: '20px', borderRadius: '50%',
                backgroundColor: c.bg, border: `2px solid ${c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', zIndex: 10,
                animation: proxyStatus === 'critical' ? 'pulse 1s infinite' : undefined
            }} title={
                proxyStatus === 'ok' ? 'Identity verified' :
                proxyStatus === 'warning' ? 'Face inconsistency detected' :
                'Proxy detected!'
            }>
                {c.icon}
            </div>
        );
    };

    // Render Setup State if Screen not shared or Camera not active
    if (screenStatus !== 'active' || cameraStatus !== 'active') {
        return (
            <div ref={panelRef} className="face-verification-panel" style={{
                position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000,
                background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem',
                border: '1px solid var(--warning)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                width: '280px', textAlign: 'center', ...posStyle
            }}>
                <div {...dragProps} style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--warning)', cursor: 'grab', userSelect: 'none' }}>
                    Test Setup Required
                </div>
                <div style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                    Screen sharing and Camera are mandatory for this test.
                </div>

                {/* Camera Preview Small */}
                <div style={{ width: '100px', height: '75px', margin: '0 auto 1rem', background: '#000', borderRadius: '4px', overflow: 'hidden', border: cameraStatus === 'error' ? '2px solid var(--error)' : 'none' }}>
                    <video ref={videoRef} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {cameraStatus === 'error' && (
                     <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginBottom: '1rem' }}>
                         Camera access denied or failed. Please check permissions.
                     </div>
                )}

                <button
                    className="btn btn-primary"
                    onClick={startScreenShare}
                    style={{ fontSize: '0.9rem', width: '100%' }}
                >
                    <Monitor size={16} style={{ marginRight: '8px' }} />
                    Enable Screen Share
                </button>
            </div>
        );
    }

    return (
        <div ref={panelRef} className="face-verification-panel" style={{
            position: 'fixed', bottom: '20px', right: '20px',
            width: '240px', background: 'var(--bg-secondary)',
            borderRadius: '0.5rem', overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: proxyStatus === 'critical' ? '2px solid #EF4444' : proxyStatus === 'warning' ? '1px solid #F59E0B' : '1px solid var(--success)',
            zIndex: 1000, ...posStyle
        }}>
            <div {...dragProps} style={{
                padding: '0.5rem',
                background: proxyStatus === 'critical' ? '#EF4444' : proxyStatus === 'warning' ? '#F59E0B' : 'var(--success)',
                color: 'white',
                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 'bold',
                cursor: 'grab', userSelect: 'none'
            }}>
                <Video size={16} />
                {proxyStatus === 'critical' ? 'Identity Alert!' : proxyStatus === 'warning' ? 'Verification Warning' : 'Proctoring Active'}
            </div>

            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: 'black' }}>
                <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    playsInline
                    muted
                />
                {getProxyIndicator()}
            </div>

            <div style={{ padding: '0.5rem', fontSize: '0.75rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {message}
            </div>
        </div>
    );
};

export default FaceVerification;
