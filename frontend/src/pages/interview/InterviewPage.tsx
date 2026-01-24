import React, { useState } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';

const InterviewPage: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '800px' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Technical Interview - Round 1</h1>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Question 1 of 5</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', color: 'var(--primary)' }}>00:45</div>
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
        </div>
    );
};

export default InterviewPage;
