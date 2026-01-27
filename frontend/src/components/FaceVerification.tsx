import React, { useEffect, useState, useRef } from 'react';
import { Video, Monitor } from 'lucide-react';
import api from '../services/api';
import { API_ENDPOINTS } from '../services/endpoints';
import { useFaceVerification } from '../context/FaceVerificationContext';

interface FaceVerificationProps {
    candidateId: string;
    // status callbacks can be added if needed
}

const FaceVerification: React.FC<FaceVerificationProps> = ({ candidateId }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const cameraStreamRef = useRef<MediaStream | null>(null);
    const { setScreenSharing } = useFaceVerification();
    
    // Status states
    const [cameraStatus, setCameraStatus] = useState<'loading' | 'active' | 'error'>('loading');
    const [screenStatus, setScreenStatus] = useState<'idle' | 'active' | 'error'>('idle');
    const [message, setMessage] = useState('Initializing Proctoring...');

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
            
            // Fallback: Use camera if screen not available (or vice versa? User said "Screen recording should be random")
            // Strict mode: If type is screen and no stream, skip or error.
            if (type === 'screen' && (!stream || !stream.active)) return;
            if (type === 'video' && (!videoRef.current)) return;

            // Capture logic
            const videoTrack = stream?.getVideoTracks()[0];
            if (!videoTrack) return;

            const captureCanvas = document.createElement('canvas');
            const { width, height } = videoTrack.getSettings();
            captureCanvas.width = width || 1920;
            captureCanvas.height = height || 1080;
            
            const ctx = captureCanvas.getContext('2d');
            if (ctx) {
                // For screen, we need to grab the frame from a video element or ImageCapture
                // Since MediaStreamTrackProcessor is complex, easiest way is to use a temp video element
                // BUT for Camera, we have videoRef. For Screen, we should probably pipe it to a hidden video or use ImageCapture.
                // Simplified: use videoRef for camera. For screen, creating a temp video element is standard pattern.
                
                if (type === 'video' && videoRef.current) {
                    ctx.drawImage(videoRef.current, 0, 0);
                } else if (type === 'screen' && stream) {
                    const tempVideo = document.createElement('video');
                    tempVideo.srcObject = stream;
                    tempVideo.muted = true;
                    await tempVideo.play();
                    ctx.drawImage(tempVideo, 0, 0);
                    // Cleanup temp video
                    tempVideo.pause();
                    tempVideo.srcObject = null;
                }

                const image = captureCanvas.toDataURL('image/png');

                // Send to backend
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
        // Fixed 1 minute interval
        const delay = 60000; 

        setTimeout(async () => {
            // Check if active
            if (screenStreamRef.current?.active) {
                // Ensure we capture valid evidence
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

    // Render Setup State if Screen not shared or Camera not active
    if (screenStatus !== 'active' || cameraStatus !== 'active') {
        return (
            <div className="face-verification-panel" style={{ 
                position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000,
                background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem',
                border: '1px solid var(--warning)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                width: '280px', textAlign: 'center'
            }}>
                <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>
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
        <div className="face-verification-panel" style={{ 
            position: 'fixed', bottom: '20px', right: '20px', 
            width: '240px', background: 'var(--bg-secondary)', 
            borderRadius: '0.5rem', overflow: 'hidden', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--success)',
            zIndex: 1000
        }}>
            <div style={{ 
                padding: '0.5rem', background: 'var(--success)', 
                color: 'white',
                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 'bold'
            }}>
                <Video size={16} /> 
                Proctoring Active
            </div>
            
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: 'black' }}>
                <video 
                    ref={videoRef} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    playsInline 
                    muted 
                />
            </div>

            <div style={{ padding: '0.5rem', fontSize: '0.75rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {message}
            </div>
        </div>
    );
};

export default FaceVerification;


