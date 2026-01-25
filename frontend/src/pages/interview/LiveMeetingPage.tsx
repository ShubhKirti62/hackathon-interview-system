import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Video, VideoOff, Mic, MicOff, ScreenShare, PhoneOff,
    Settings, MessageSquare, Users, Brain, CheckCircle
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { APP_ROUTES } from '../../routes';
import { showToast } from '../../utils/toast';
import { VideoCallManager } from '../../utils/webrtc';
import EnhancedSlider from '../../components/Slider/EnhancedSlider';

const LiveMeetingPage: React.FC = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [meetingDuration, setMeetingDuration] = useState(0);
    const [slotData, setSlotData] = useState<any>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionState, setConnectionState] = useState<string>('disconnected');
    const [videoCallManager] = useState(() => new VideoCallManager());

    // Feedback States
    const [remarks, setRemarks] = useState('');
    const [score, setScore] = useState(5);
    const [metrics, setMetrics] = useState({
        relevance: 3,
        clarity: 3,
        depth: 3,
        accuracy: 3,
        structure: 3,
        confidence: 3,
        honesty: 3
    });

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const fetchSlot = async () => {
            try {
                const res = await api.get(`/slots`);
                const currentSlot = res.data.find((s: any) => s._id === id);
                setSlotData(currentSlot);
            } catch (err) {
                console.error('Failed to fetch slot', err);
            }
        };

        fetchSlot();

        // Initialize video call manager
        initializeVideoCall();

        // Cleanup on unmount
        return () => {
            if (videoCallManager) {
                videoCallManager.disconnect();
            }
        };
    }, [id]);

    const initializeVideoCall = async () => {
        try {
            setIsConnecting(true);
            
            // Set video refs
            videoCallManager.setLocalVideoRef(localVideoRef.current);
            videoCallManager.setRemoteVideoRef(remoteVideoRef.current);
            
            // Setup connection state callback
            videoCallManager.onConnectionStateChange((state) => {
                setConnectionState(state);
                if (state === 'connected') {
                    showToast.success('Connected to interview room');
                    setIsConnecting(false);
                } else if (state === 'failed' || state === 'disconnected') {
                    showToast.error('Connection lost');
                    setIsConnecting(false);
                }
            });
            
            // Initialize local stream
            await videoCallManager.initializeLocalStream(true, true);
            
            // Start meeting timer
            const timer = setInterval(() => {
                setMeetingDuration(prev => prev + 1);
            }, 1000);
            
            return () => clearInterval(timer);
        } catch (error) {
            console.error('Failed to initialize video call:', error);
            showToast.error('Failed to access camera/microphone');
            setIsConnecting(false);
        }
    };

    const toggleVideo = () => {
        const newVideoState = !isVideoOff;
        setIsVideoOff(newVideoState);
        videoCallManager.toggleVideo(!newVideoState);
    };

    const toggleAudio = () => {
        const newAudioState = !isMuted;
        setIsMuted(newAudioState);
        videoCallManager.toggleAudio(!newAudioState);
    };

    const toggleScreenShare = async () => {
        try {
            if (!isScreenSharing) {
                await videoCallManager.startScreenShare();
                setIsScreenSharing(true);
                showToast.success('Screen sharing started');
            } else {
                await videoCallManager.stopScreenShare();
                setIsScreenSharing(false);
                showToast.success('Screen sharing stopped');
            }
        } catch (error) {
            console.error('Screen share error:', error);
            showToast.error('Failed to share screen');
        }
    };

    const endCall = () => {
        if (videoCallManager) {
            videoCallManager.disconnect();
        }
        navigate(user?.role === 'candidate' ? APP_ROUTES.CANDIDATE.DASHBOARD : APP_ROUTES.ADMIN.DASHBOARD);
    };

    const startCamera = async () => {
        try {
            await videoCallManager.initializeLocalStream(true, true);
            videoCallManager.setLocalVideoRef(localVideoRef.current);
        } catch (err) {
            console.error('Camera access denied', err);
            showToast.error('Failed to access camera/microphone');
        }
    };

    const stopCamera = () => {
        if (videoCallManager) {
            videoCallManager.disconnect();
        }
    };

    const handleEndMeeting = () => {
        stopCamera();
        setShowFeedback(true);
    };

    const submitFeedback = async () => {
        try {
            const role = user?.role === 'candidate' ? 'candidate' : 'interviewer';
            await api.post(`/slots/feedback/${id}`, {
                score,
                remarks,
                metrics: role === 'interviewer' ? metrics : undefined,
                type: role
            });
            showToast.success('Feedback submitted successfully!');
            navigate(user?.role === 'candidate' ? APP_ROUTES.CANDIDATE.DASHBOARD : APP_ROUTES.ADMIN.DASHBOARD);
        } catch (err) {
            showToast.error('Failed to submit feedback');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (showFeedback) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
                <div className="card" style={{ width: '100%', maxWidth: '600px', animation: 'slideUp 0.4s ease' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <CheckCircle size={32} style={{ color: 'var(--success)' }} />
                        </div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Meeting Ended</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Please provide your feedback for the session.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {user?.role !== 'candidate' && (
                            <div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Brain size={20} style={{ color: 'var(--primary)' }} /> Performance Metrics (0-5)
                                </h3>
                                {Object.entries(metrics).map(([key, val]) => (
                                    <div key={key} style={{ marginBottom: '1.5rem' }}>
                                        <EnhancedSlider
                                            min={0}
                                            max={5}
                                            step={1}
                                            value={val}
                                            onChange={(newValue: number) => setMetrics({ ...metrics, [key]: newValue })}
                                            label={key.charAt(0).toUpperCase() + key.slice(1)}
                                            color="primary"
                                            size="medium"
                                            marks={[
                                                { value: 0, label: 'Poor' },
                                                { value: 2.5, label: 'Average' },
                                                { value: 5, label: 'Excellent' }
                                            ]}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ marginBottom: '1.5rem' }}>
                            <EnhancedSlider
                                min={0}
                                max={10}
                                step={1}
                                value={score}
                                onChange={setScore}
                                label="Overall Score"
                                color="success"
                                size="large"
                                marks={[
                                    { value: 0, label: '0' },
                                    { value: 5, label: '5' },
                                    { value: 10, label: '10' }
                                ]}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '1rem', marginBottom: '0.5rem' }}>Detailed Remarks</label>
                            <textarea
                                className="input"
                                style={{ minHeight: '100px', resize: 'vertical' }}
                                placeholder="Share your experience and observations..."
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                            />
                        </div>

                        <button onClick={submitFeedback} className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                            Submit Feedback & Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '100vh', backgroundColor: '#000', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            {/* Header / Info */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
                padding: '1.5rem 2rem', background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 1.5s infinite' }}></div>
                        <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 'bold' }}>Round 2 Technical Interview</h2>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                        Session Live: {formatTime(meetingDuration)}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}>
                        <Users size={18} />
                    </button>
                    <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}>
                        <MessageSquare size={18} />
                    </button>
                    <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}>
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* Video Grid */}
            <div style={{ flex: 1, padding: '5rem 2rem 8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Local Video */}
                <div style={{ position: 'relative', background: '#111827', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', backgroundColor: 'rgba(0,0,0,0.6)', padding: '0.4rem 1rem', borderRadius: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                        {user?.name} (You)
                    </div>
                </div>

                {/* Remote Video (Placeholder for Peer) */}
                <div style={{ position: 'relative', background: '#111827', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: remoteVideoRef.current?.srcObject ? 'block' : 'none' }} />
                    {!remoteVideoRef.current?.srcObject && (
                        <div style={{ textAlign: 'center', color: '#4b5563' }}>
                            <Users size={64} style={{ marginBottom: '1rem' }} />
                            <div>Waiting for peer to join...</div>
                        </div>
                    )}
                    <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', backgroundColor: 'rgba(0,0,0,0.6)', padding: '0.4rem 1rem', borderRadius: '0.5rem', color: 'white', fontSize: '0.875rem' }}>
                        {user?.role === 'candidate' ? 'Interviewer' : (slotData?.candidateId?.name || 'Candidate')}
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div style={{
                position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
                backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)',
                padding: '1rem 2rem', borderRadius: '4rem', display: 'flex', alignItems: 'center', gap: '2rem',
                border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>
                <button
                    onClick={toggleAudio}
                    style={{ background: isMuted ? 'var(--error)' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                >
                    {isMuted ? <MicOff /> : <Mic />}
                </button>

                <button
                    onClick={toggleVideo}
                    style={{ background: isVideoOff ? 'var(--error)' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                >
                    {isVideoOff ? <VideoOff /> : <Video />}
                </button>

                <button
                    onClick={toggleScreenShare}
                    style={{ background: isScreenSharing ? 'var(--primary)' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                >
                    <ScreenShare />
                </button>

                <button
                    onClick={handleEndMeeting}
                    style={{ background: '#ef4444', border: 'none', color: 'white', padding: '0 2rem', height: '56px', borderRadius: '4rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold' }}
                >
                    <PhoneOff size={20} /> End Call
                </button>
            </div>
        </div>
    );
};

export default LiveMeetingPage;
