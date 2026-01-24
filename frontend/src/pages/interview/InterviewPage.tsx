import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Mic, MicOff, Send, AlertTriangle } from 'lucide-react';
import FaceVerification from '../../components/FaceVerification';
import type { VerificationStatus } from '../../context/FaceVerificationContext';

const InterviewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
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

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>
            {showMismatchWarning && (
                <div className="mismatch-alert">
                    <AlertTriangle size={20} />
                    <span>Multiple face mismatches detected. HR has been notified.</span>
                </div>
            )}

            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        Technical Interview - Round 1
                    </h1>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Question 1 of 5</span>
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
                    <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', color: 'var(--primary)' }}>00:45</div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', textAlign: 'center', color: 'var(--text-primary)' }}>
                    "Explain the difference between `let`, `const`, and `var` in JavaScript."
                </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsRecording(!isRecording)}
                        className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
                        style={{
                            borderRadius: '50%',
                            width: '80px',
                            height: '80px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isRecording ? 'var(--error)' : 'var(--primary)'
                        }}
                    >
                        {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
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
                            animation: 'pulse 1s infinite'
                        }} />
                    )}
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {isRecording ? 'Listening... Speak clearly into your microphone' : 'Click the microphone to start answering'}
                </p>

                <div style={{ width: '100%' }}>
                    <div className="card" style={{ padding: '1rem', minHeight: '100px', backgroundColor: 'var(--bg-secondary)', marginBottom: '1rem' }}>
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Transcript will appear here...
                        </p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" style={{ gap: '0.5rem' }}>
                            Next Question <Send size={18} />
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
