import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Send, AlertCircle, Clock, WifiOff, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/endpoints';
import { APP_ROUTES } from '../../routes';

interface Question {
    _id: string;
    text: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface Interview {
    _id: string;
    questions: Question[];
    currentQuestionIndex: number;
    remainingTime?: number;
    status: string;
}
import FaceVerification from '../../components/FaceVerification';
import type { VerificationStatus } from '../../context/FaceVerificationContext';

const InterviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [interview, setInterview] = useState<Interview | null>(null);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
    const [showMismatchWarning, setShowMismatchWarning] = useState(false);

    const handleVerificationChange = useCallback((status: VerificationStatus) => {
        setVerificationStatus(status);
    }, []);

    const handleMaxMismatchesReached = useCallback(() => {
        setShowMismatchWarning(true);
        // In a real app, you would notify HR/admin here via API
        console.log('Max mismatches reached - notifying HR');
    }, []);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [timeLimits, setTimeLimits] = useState<Record<string, number>>({
        easy: 60,
        medium: 120,
        hard: 180
    });

    const timerRef = useRef<any>(null);
    const saveRef = useRef<any>(null);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        loadInitialData();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (timerRef.current) clearInterval(timerRef.current);
            if (saveRef.current) clearInterval(saveRef.current);
        };
    }, [id]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch settings for time limits
            const settingsRes = await api.get(API_ENDPOINTS.SETTINGS.BASE);
            const limits: Record<string, number> = {};
            settingsRes.data.forEach((s: any) => {
                if (s.key.startsWith('time_limit_')) {
                    limits[s.key.replace('time_limit_', '')] = s.value;
                }
            });
            setTimeLimits(prev => ({ ...prev, ...limits }));

            // 2. If no ID, find latest in-progress interview or start new (mock start for now)
            let interviewId = id;
            if (!interviewId) {
                // In real app, we might check for an existing session or show "Start Interview"
                // For this demo, let's assume we need an ID or redirect
                setError('No active interview session found.');
                setLoading(false);
                return;
            }

            const interviewRes = await api.get(API_ENDPOINTS.INTERVIEWS.BY_ID(interviewId));
            const data = interviewRes.data;

            if (data.status === 'Completed') {
                navigate(APP_ROUTES.HOME);
                return;
            }

            setInterview(data);
            setCurrentQIndex(data.currentQuestionIndex || 0);

            // Set time left from saved state or default for current difficulty
            if (data.remainingTime !== undefined && data.remainingTime !== null) {
                setTimeLeft(data.remainingTime);
            } else {
                const difficulty = data.questions[data.currentQuestionIndex || 0]?.difficulty?.toLowerCase() || 'medium';
                setTimeLeft(limits[difficulty] || 120);
            }

        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load interview');
        } finally {
            setLoading(false);
        }
    };

    // Timer logic
    useEffect(() => {
        if (!loading && interview && timeLeft !== null && timeLeft > 0 && !isOffline) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [loading, interview, isOffline, timeLeft === 0]);

    // Auto-save state every 5 seconds
    useEffect(() => {
        if (interview && id && !isOffline) {
            saveRef.current = setInterval(() => {
                saveProgress();
            }, 5000);
        }

        return () => {
            if (saveRef.current) clearInterval(saveRef.current);
        };
    }, [interview, currentQIndex, timeLeft, isOffline]);

    const saveProgress = async () => {
        if (!id || isOffline || timeLeft === null) return;
        try {
            await api.patch(API_ENDPOINTS.INTERVIEWS.UPDATE_STATE(id), {
                currentQuestionIndex: currentQIndex,
                remainingTime: timeLeft
            });
            console.log('Progress saved:', { currentQIndex, timeLeft });
        } catch (err) {
            console.warn('Failed to auto-save progress', err);
        }
    };

    const handleNextQuestion = async () => {
        if (!interview || !id) return;

        // Save progress before moving
        await saveProgress();

        if (currentQIndex < interview.questions.length - 1) {
            const nextIndex = currentQIndex + 1;
            setCurrentQIndex(nextIndex);

            // Set new time limit for next question
            const nextDifficulty = interview.questions[nextIndex]?.difficulty?.toLowerCase() || 'medium';
            setTimeLeft(timeLimits[nextDifficulty] || 120);

            // Update on server immediately
            await api.patch(API_ENDPOINTS.INTERVIEWS.UPDATE_STATE(id), {
                currentQuestionIndex: nextIndex,
                remainingTime: timeLimits[nextDifficulty] || 120
            });
        } else {
            // Complete Interview
            try {
                await api.post(API_ENDPOINTS.INTERVIEWS.COMPLETE(id));
                navigate(APP_ROUTES.HOME);
            } catch (err) {
                setError('Failed to complete interview');
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', color: 'var(--text-primary)' }}>
            <div className="animate-spin" style={{ marginRight: '1rem' }}>⌛</div> Loading Interview Content...
        </div>
    );

    if (error) return (
        <div className="container" style={{ padding: '2rem' }}>
            <div className="card" style={{ border: '1px solid var(--error)', backgroundColor: 'rgba(239, 68, 68, 0.05)', textAlign: 'center' }}>
                <AlertCircle size={48} style={{ color: 'var(--error)', marginBottom: '1rem' }} />
                <h2 style={{ color: 'var(--error)' }}>Error</h2>
                <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
                <button onClick={() => navigate(APP_ROUTES.HOME)} className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Home</button>
            </div>
        </div>
    );

    const currentQuestion = interview?.questions[currentQIndex];

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>
            {showMismatchWarning && (
                <div className="mismatch-alert">
                    <AlertTriangle size={20} />
                    <span>Multiple face mismatches detected. HR has been notified.</span>
                </div>
            )}

            {isOffline && (
                <div style={{
                    backgroundColor: 'var(--error)',
                    color: 'white',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    animation: 'fadeIn 0.5s ease'
                }}>
                    <WifiOff size={18} />
                    <strong>Internet Disconnected:</strong> Timer paused. Please reconnect to resume.
                </div>
            )}

            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        Technical Interview Session
                    </h1>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Question {currentQIndex + 1} of {interview?.questions.length || 0} ({currentQuestion?.difficulty} Round)
                    </span>
                </div>
                <div style={{
                    fontSize: '1.5rem',
                    fontFamily: 'monospace',
                    color: (timeLeft || 0) < 30 ? 'var(--error)' : 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem'
                }}>
                    <Clock size={20} />
                    {formatTime(timeLeft || 0)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                        className={`verification-badge ${verificationStatus}`}
                        title={`Verification: ${verificationStatus}`}
                    >
                        {verificationStatus === 'verified' ? 'Verified' :
                            verificationStatus === 'mismatch' ? 'Mismatch' :
                                verificationStatus === 'pending' ? 'Checking...' : 'Pending'}
                    </div>
                </div>
            </div>

            <div className="card" style={{
                marginBottom: '2rem',
                minHeight: '220px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderLeft: `6px solid ${currentQuestion?.difficulty === 'Hard' ? 'var(--error)' : currentQuestion?.difficulty === 'Medium' ? 'var(--warning)' : 'var(--success)'}`
            }}>
                <h2 style={{ fontSize: '1.5rem', textAlign: 'center', padding: '1rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    "{currentQuestion?.text}"
                </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsRecording(!isRecording)}
                        className={`btn`}
                        disabled={isOffline || (timeLeft === 0)}
                        style={{
                            borderRadius: '50%',
                            width: '80px',
                            height: '80px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isRecording ? 'var(--error)' : 'var(--primary)',
                            opacity: (isOffline || timeLeft === 0) ? 0.5 : 1,
                            transition: 'all 0.3s'
                        }}
                    >
                        {isRecording ? <MicOff size={32} color="white" /> : <Mic size={32} color="white" />}
                    </button>
                    {isRecording && (
                        <div style={{
                            position: 'absolute',
                            top: '-10px',
                            right: '-10px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--error)',
                            border: '2px solid white',
                            boxShadow: '0 0 10px var(--error)',
                            animation: 'pulse 1s infinite'
                        }} />
                    )}
                </div>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                    {timeLeft === 0
                        ? 'Time is up for this question!'
                        : isOffline
                            ? 'Paused due to network issues'
                            : isRecording
                                ? 'Listening... Speak clearly into your microphone'
                                : 'Click the microphone to start answering'
                    }
                </p>

                <div style={{ width: '100%' }}>
                    <div className="card" style={{ padding: '1.5rem', minHeight: '120px', backgroundColor: 'var(--bg-secondary)', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            Live Transcription
                        </div>
                        <p style={{ color: isRecording ? 'var(--text-primary)' : 'var(--text-secondary)', fontStyle: isRecording ? 'normal' : 'italic' }}>
                            {isRecording ? 'The candidate is explaining the conceptual differences...' : 'Transcription will appear here as you speak...'}
                        </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Progress auto-saved locally and to server
                        </div>
                        <button
                            onClick={handleNextQuestion}
                            className="btn btn-primary"
                            style={{ gap: '0.5rem', padding: '0.75rem 2rem' }}
                            disabled={isOffline}
                        >
                            {currentQIndex < (interview?.questions.length || 0) - 1 ? 'Next Question' : 'Finish Interview'} <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Face Verification Panel */}
            <FaceVerification
                candidateId={id || ''}
                verificationInterval={15000}
                maxMismatches={3}
                onVerificationChange={handleVerificationChange}
                onMaxMismatchesReached={handleMaxMismatchesReached}
                minimized={false}
            />
        </div>
    );
};

export default InterviewPage;
