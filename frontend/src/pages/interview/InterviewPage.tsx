import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Send, AlertCircle, Clock, WifiOff, AlertTriangle, Eye } from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/endpoints';
import { APP_ROUTES } from '../../routes';
import { showToast } from '../../utils/toast';
import { TypeAnimation } from 'react-type-animation';
import { useFaceVerification } from '../../context/FaceVerificationContext';
import { useTabDetection } from '../../hooks/useTabDetection';

interface Question {
    _id: string;
    text: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    type: 'Descriptive';
}

interface Interview {
    _id: string;
    candidateId: { _id: string } | string;
    questions: Question[];
    currentQuestionIndex: number;
    remainingTime?: number;
    status: string;
    round?: string; // Added round property
}
import FaceVerification from '../../components/FaceVerification';

const InterviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isScreenSharing } = useFaceVerification();

    const [interview, setInterview] = useState<Interview | null>(null);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [manualQuestion, setManualQuestion] = useState('');



    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [transcript, setTranscript] = useState('');
    const [timeLimits, setTimeLimits] = useState<Record<string, number>>({
        easy: 60,
        medium: 120,
        hard: 180
    });

    // Anti-fraud: Tab switching detection
    const handleViolation = useCallback(async (violation: any, totalViolations: number) => {
        if (!id) return;
        try {
            const response = await api.post(API_ENDPOINTS.INTERVIEWS.VIOLATION(id), {
                type: violation.type,
                duration: violation.duration,
                questionIndex: currentQIndex
            });

            if (response.data.terminated && response.data.blocked) {
                // Critical: 5/5 violations - auto logout and block
                showToast.error('Interview terminated due to excessive violations. You have been blocked.');
                // Clear local storage and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('role');
                setTimeout(() => {
                    window.location.href = '/login?blocked=true';
                }, 2000);
            } else if (response.data.warningLevel === 'critical') {
                showToast.error('Multiple violations detected. Your interview may be flagged for review.');
            } else if (response.data.warningLevel === 'high') {
                showToast.error('Warning: Continued tab switching may affect your evaluation.');
            }
        } catch (err: any) {
            // Handle case where interview is already terminated
            if (err.response?.data?.terminated) {
                showToast.error('Your interview has been terminated.');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('role');
                setTimeout(() => {
                    window.location.href = '/login?blocked=true';
                }, 2000);
            } else {
                console.warn('Failed to record violation', err);
            }
        }
    }, [id, currentQIndex]);

    const {
        violations,
        violationCount,
        isPageVisible,
        warningMessage,
        clearWarning
    } = useTabDetection({
        enabled: interview?.status === 'In-Progress',
        maxWarnings: 5,
        onViolation: handleViolation,
        onMaxViolationsReached: () => {
            showToast.error('Maximum violations reached. You have been blocked from the interview.');
            // Clear local storage and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            setTimeout(() => {
                window.location.href = '/login?blocked=true';
            }, 2000);
        }
    });

    const recognitionRef = useRef<any>(null);

    const timerRef = useRef<any>(null);
    const saveRef = useRef<any>(null);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        loadInitialData();
        initSpeechRecognition();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (timerRef.current) clearInterval(timerRef.current);
            if (saveRef.current) clearInterval(saveRef.current);
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [id]);

    const initSpeechRecognition = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                setTranscript(finalTranscript || interimTranscript);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') setIsRecording(false);
            };

            recognitionRef.current = recognition;
        }
    };

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

    // Timer logic - only runs when screen sharing is active
    useEffect(() => {
        if (!loading && interview && timeLeft !== null && timeLeft > 0 && !isOffline && isScreenSharing) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [loading, !!interview, isOffline, isScreenSharing]); // Added isScreenSharing dependency

    useEffect(() => {
        if (timeLeft === 0) {
            if (isRecording) {
                recognitionRef.current?.stop();
                setIsRecording(false);
            }
            // Auto advance after brief delay
            const timer = setTimeout(() => {
                handleNextQuestion();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

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
    }, [id, !!interview, isOffline, currentQIndex, transcript]);

    const toggleRecording = () => {
 

        if (!recognitionRef.current) {
            showToast.error('Speech Recognition is not supported in this browser.');
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        } else {
            setTranscript('');
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const saveProgress = async () => {
        if (!id || isOffline || timeLeft === null) return;
        try {
            await api.patch(API_ENDPOINTS.INTERVIEWS.UPDATE_STATE(id), {
                currentQuestionIndex: currentQIndex,
                remainingTime: timeLeft,
                draftAnswer: transcript || ''
            });
        } catch (err) {
            console.warn('Failed to auto-save progress', err);
        }
    };

    const handleNextQuestion = async () => {
        if (!interview || !id) return;

        // Check if there's any answer (voice or manual)
        const hasVoiceAnswer = transcript && transcript.trim() !== '';
        const hasManualAnswer = manualQuestion && manualQuestion.trim() !== '';
        
        if (!hasVoiceAnswer && !hasManualAnswer) {
            showToast.error('Please provide an answer before proceeding');
            return;
        }

        // Combine answers - prioritize manual answer if both exist
        const finalAnswer = hasManualAnswer ? manualQuestion : transcript;

        // stop recording if on
        if (isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }

        // 1. Submit current answer before moving
        try {
            await api.post(API_ENDPOINTS.INTERVIEWS.SUBMIT_RESPONSE(id), {
                questionId: interview.questions[currentQIndex]._id,
                userResponseText: finalAnswer || 'No response provided',
                timeTakenSeconds: (timeLimits[interview.questions[currentQIndex].difficulty.toLowerCase()] || 120) - timeLeft!
            });
        } catch (err) {
            console.warn('Failed to submit response', err);
        }

        // 2. Move to next or complete
        if (currentQIndex < interview.questions.length - 1) {
            const nextIndex = currentQIndex + 1;
            setCurrentQIndex(nextIndex);
            setTranscript('');
            setManualQuestion(''); // Clear manual input too

            // Set new time limit for next question
            const nextDifficulty = interview.questions[nextIndex]?.difficulty?.toLowerCase() || 'medium';
            setTimeLeft(timeLimits[nextDifficulty] || 120);

            // Update on server state
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
        <div className="container" style={{ padding: '2rem 1rem', width: '100%'}}>


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

            {/* Tab Switching Warning */}
            {warningMessage && (
                <div style={{
                    backgroundColor: violationCount >= 3 ? 'var(--error)' : 'var(--warning)',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    animation: 'slideUp 0.3s ease'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={18} />
                        <span>{warningMessage}</span>
                    </div>
                    <button
                        onClick={clearWarning}
                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.25rem' }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Monitoring Indicator */}
            {interview?.status === 'In-Progress' && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '1rem',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    width: 'fit-content'
                }}>
                    <Eye size={14} style={{ color: violationCount > 0 ? 'var(--warning)' : 'var(--success)' }} />
                    <span>Session monitored</span>
                    {violationCount > 0 && (
                        <span style={{ color: 'var(--warning)', fontWeight: '600' }}>
                            • {violationCount} violation{violationCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            )}

            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        Technical Interview Session
                    </h1>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Question {currentQIndex + 1} of {interview?.questions.length || 0} (Descriptive - {currentQuestion?.difficulty} Round)
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
    
                    {/* Microphone Button */}
                    <button
                        onClick={toggleRecording}
                        className={`btn`}
                        disabled={!isScreenSharing || isOffline || (timeLeft === 0)}
                        style={{
                            borderRadius: '50%',
                            width: '50px',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isRecording ? 'var(--error)' : 'var(--primary)',
                            opacity: (!isScreenSharing || isOffline || timeLeft === 0) ? 0.5 : 1,
                            transition: 'all 0.3s'
                        }}
                    >
                        {isRecording ? <MicOff size={20} color="white" /> : <Mic size={20} color="white" />}
                    </button>
                </div>
            </div>

            <div className="card" style={{
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderLeft: `6px solid ${currentQuestion?.difficulty === 'Hard' ? 'var(--error)' : currentQuestion?.difficulty === 'Medium' ? 'var(--warning)' : 'var(--success)'}`
            }}>
                <h2 style={{ fontSize: '1.5rem', textAlign: 'center', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    <TypeAnimation
                        key={currentQuestion?._id || currentQIndex}
                        sequence={[`"${currentQuestion?.text || ''}"`]}
                        speed={70}
                        cursor={false}
                        wrapper="span"
                    />
                </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                    {timeLeft === 0
                        ? 'Time is up for this question!'
                        : isOffline
                            ? 'Paused due to network issues'
                            : !isScreenSharing
                                ? 'Microphone disabled - screen sharing is required'
                                : isRecording
                                    ? 'Listening... Speak clearly into your microphone'
                                    : 'Click the microphone to start answering'
                    }
                </p>

                <div style={{ width: '100%', display: 'flex', gap: '1rem' }}>
                    {/* Live Transcription */}
                    <div className="card" style={{ 
                        flex: 1, 
                        padding: '1.5rem', 
                        minHeight: '150px', 
                        backgroundColor: 'var(--bg-secondary)', 
                        marginBottom: '1.5rem' 
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            Live Transcription
                        </div>
                        <p style={{ color: transcript ? 'var(--text-primary)' : 'var(--text-secondary)', fontStyle: transcript ? 'normal' : 'italic' }}>
                            {transcript || 'Transcription will appear here as you speak...'}
                        </p>
                    </div>

                    {/* Manual Input */}
                    <div className="card" style={{ 
                        flex: 1, 
                        padding: '1.5rem', 
                        minHeight: '150px', 
                        backgroundColor: 'var(--bg-secondary)', 
                        marginBottom: '1.5rem',
                        border: '2px solid var(--primary)'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            Manual Answer Input
                        </div>
                        <textarea
                            className="input"
                            value={manualQuestion}
                            onChange={(e) => setManualQuestion(e.target.value)}
                            placeholder="Type your answer here manually..."
                            rows={4}
                            style={{ 
                                width: '100%', 
                                resize: 'vertical',
                                minHeight: '80px'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Progress auto-saved locally and to server
                    </div>
                    <button
                        onClick={handleNextQuestion}
                        className="btn btn-primary"
                        style={{ gap: '0.5rem', padding: '0.75rem 2rem' }}
                        disabled={isOffline || isRecording || (!transcript.trim() && !manualQuestion.trim())}
                    >
                        {currentQIndex < (interview?.questions.length || 0) - 1 ? 'Next Question' : 'Finish Interview'} <Send size={18} />
                    </button>
                </div>
            </div>

            {/* Video Monitor Panel */}
            {interview && (
                <FaceVerification 
                    candidateId={typeof interview.candidateId === 'string' ? interview.candidateId : interview.candidateId._id} 
                />
            )}
        </div>
    );
};

export default InterviewPage;
