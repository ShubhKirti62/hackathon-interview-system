import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Play,
    Users,
    FileText,
    Mail,
    Calendar,
    Shield,
    Bot,
    Mic,
    Camera,
    Monitor,
    AlertTriangle,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Clock,
    TrendingUp,
    Eye,
    Zap,
    BarChart3,
    Brain,
    Video,
    Lock
} from 'lucide-react';

interface DemoStep {
    id: number;
    title: string;
    duration: string;
    icon: React.ReactNode;
    features: {
        name: string;
        description: string;
        icon: React.ReactNode;
    }[];
}

const DemoPage: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isPresenting, setIsPresenting] = useState(false);

    const demoSteps: DemoStep[] = [
        {
            id: 1,
            title: 'Admin Dashboard',
            duration: '5 min',
            icon: <Users size={24} />,
            features: [
                { name: 'Candidate Management', description: 'Add, edit, view, delete candidates with status tracking', icon: <Users size={18} /> },
                { name: 'Question Bank', description: 'Domain-wise questions (Frontend, Backend, etc.) with difficulty levels', icon: <FileText size={18} /> },
                { name: 'Email Scanner', description: 'Auto-import resumes from Gmail with NLP filtering (1 min scan)', icon: <Mail size={18} /> },
                { name: 'Interview Slots', description: 'Create slots, assign interviewers, send email invites', icon: <Calendar size={18} /> },
                { name: 'Fraud Detection', description: 'Monitor suspicious activities, review alerts, block users', icon: <Shield size={18} /> },
                { name: 'Analytics', description: 'Status distribution charts, domain-wise candidate counts', icon: <BarChart3 size={18} /> }
            ]
        },
        {
            id: 2,
            title: 'Candidate Experience',
            duration: '5 min',
            icon: <Bot size={24} />,
            features: [
                { name: 'Self-Registration', description: 'Candidates sign up with profile details and resume upload', icon: <Users size={18} /> },
                { name: 'Dashboard', description: 'View profile, interview status, booked slots, performance charts', icon: <Monitor size={18} /> },
                { name: 'Interview Setup', description: '3-step wizard: Permissions → Face Capture → Ready', icon: <Camera size={18} /> },
                { name: 'AI Interview', description: 'Questions with typewriter effect, voice-to-text, timer per question', icon: <Mic size={18} /> },
                { name: 'Anti-Fraud Protection', description: 'Tab-switch detection (5 strikes = block), face verification', icon: <Eye size={18} /> },
                { name: 'Auto-Evaluation', description: 'AI scores on 7 metrics: Relevance, Clarity, Depth, etc.', icon: <TrendingUp size={18} /> }
            ]
        },
        {
            id: 3,
            title: 'Round 2 & Results',
            duration: '5 min',
            icon: <Video size={24} />,
            features: [
                { name: 'Slot Booking', description: 'After Round 1, candidates book live interview slots', icon: <Calendar size={18} /> },
                { name: 'Live Meeting', description: 'Video call with interviewer, real-time countdown', icon: <Video size={18} /> },
                { name: 'Interviewer Feedback', description: 'Structured feedback form after live interview', icon: <FileText size={18} /> },
                { name: 'Screenshot Viewer', description: 'Review captured screenshots during AI interview', icon: <Camera size={18} /> },
                { name: 'Performance Charts', description: 'Radar chart and bar chart of evaluation metrics', icon: <BarChart3 size={18} /> },
                { name: 'Final Decision', description: 'Shortlist or reject with full audit trail', icon: <CheckCircle size={18} /> }
            ]
        }
    ];

    const keyFeatures = [
        {
            icon: <Brain size={32} />,
            title: 'AI-Powered Interviews',
            description: 'Automated question generation, speech-to-text, and intelligent evaluation on 7 metrics',
            color: '#3B82F6'
        },
        {
            icon: <Shield size={32} />,
            title: 'Anti-Fraud System',
            description: 'Face verification, tab-switch detection, screen sharing, and screenshot capture',
            color: '#EF4444'
        },
        {
            icon: <Mail size={32} />,
            title: 'Email Resume Scanner',
            description: 'Auto-scans inbox every 1 minute with NLP filter to identify job applications',
            color: '#10B981'
        },
        {
            icon: <Zap size={32} />,
            title: 'Two-Round Process',
            description: 'Round 1: Automated AI interview | Round 2: Live interview with slot booking',
            color: '#F59E0B'
        }
    ];

    const flowSteps = [
        { label: 'Candidate Entry', sublabel: 'Register / Email Import / Admin Add', color: '#3B82F6' },
        { label: 'Interview Setup', sublabel: 'Permissions + Face Registration', color: '#8B5CF6' },
        { label: 'Round 1: AI Interview', sublabel: 'Automated Questions + Scoring', color: '#10B981' },
        { label: 'Slot Booking', sublabel: 'Schedule Round 2', color: '#F59E0B' },
        { label: 'Round 2: Live Interview', sublabel: 'Video Call + Feedback', color: '#EC4899' },
        { label: 'Final Decision', sublabel: 'Shortlist / Reject', color: '#14B8A6' }
    ];

    const handleNavigate = (path: string) => {
        navigate(path);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
            {/* Header */}
            <header style={{
                backgroundColor: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-color)',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: 'var(--primary)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <Bot size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>
                            NvestCareers
                        </h1>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                            AI Interview System Demo
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setIsPresenting(!isPresenting)}
                        className="btn"
                        style={{
                            backgroundColor: isPresenting ? 'var(--error)' : 'var(--success)',
                            color: 'white',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {isPresenting ? <><Eye size={18} /> Exit Presentation</> : <><Play size={18} /> Start Presentation</>}
                    </button>
                    <button
                        onClick={() => handleNavigate('/login')}
                        className="btn btn-primary"
                    >
                        Go to App
                    </button>
                </div>
            </header>

            {/* Timer Badge */}
            <div style={{
                position: 'fixed',
                top: '80px',
                right: '2rem',
                backgroundColor: 'var(--bg-card)',
                padding: '0.75rem 1.25rem',
                borderRadius: '2rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                zIndex: 99
            }}>
                <Clock size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>15 Min Demo</span>
            </div>

            <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                {/* Hero Section */}
                <section style={{
                    textAlign: 'center',
                    padding: '3rem 2rem',
                    marginBottom: '3rem'
                }}>
                    <h2 style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)',
                        marginBottom: '1rem'
                    }}>
                        AI-Powered Interview Platform
                    </h2>
                    <p style={{
                        fontSize: '1.25rem',
                        color: 'var(--text-secondary)',
                        maxWidth: '700px',
                        margin: '0 auto 2rem'
                    }}>
                        Automate candidate screening with face verification, fraud detection,
                        speech-to-text interviews, and intelligent auto-scoring.
                    </p>
                </section>

                {/* Key Features Grid */}
                <section style={{ marginBottom: '4rem' }}>
                    <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        Key Features
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {keyFeatures.map((feature, index) => (
                            <div
                                key={index}
                                className="card"
                                style={{
                                    padding: '1.5rem',
                                    borderTop: `4px solid ${feature.color}`,
                                    transition: 'transform 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ color: feature.color, marginBottom: '1rem' }}>
                                    {feature.icon}
                                </div>
                                <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                    {feature.title}
                                </h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Flow Diagram */}
                <section style={{ marginBottom: '4rem' }}>
                    <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        Interview Flow
                    </h3>
                    <div className="card" style={{ padding: '2rem', overflowX: 'auto' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minWidth: '900px',
                            gap: '0.5rem'
                        }}>
                            {flowSteps.map((step, index) => (
                                <React.Fragment key={index}>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        flex: 1
                                    }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '50%',
                                            backgroundColor: step.color,
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '1.25rem',
                                            marginBottom: '0.75rem'
                                        }}>
                                            {index + 1}
                                        </div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                            {step.label}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {step.sublabel}
                                        </div>
                                    </div>
                                    {index < flowSteps.length - 1 && (
                                        <ArrowRight size={24} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Demo Steps */}
                <section style={{ marginBottom: '4rem' }}>
                    <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        Demo Walkthrough (15 Minutes)
                    </h3>

                    {/* Step Navigation */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '1rem',
                        marginBottom: '2rem'
                    }}>
                        {demoSteps.map((step, index) => (
                            <button
                                key={step.id}
                                onClick={() => setCurrentStep(index)}
                                style={{
                                    padding: '1rem 1.5rem',
                                    borderRadius: '0.75rem',
                                    border: currentStep === index ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                    backgroundColor: currentStep === index ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-card)',
                                    color: currentStep === index ? 'var(--primary)' : 'var(--text-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {step.icon}
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 'bold' }}>{step.title}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{step.duration}</div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="card" style={{ padding: '2rem' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            marginBottom: '1.5rem',
                            paddingBottom: '1rem',
                            borderBottom: '1px solid var(--border-color)'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '0.75rem',
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {demoSteps[currentStep].icon}
                            </div>
                            <div>
                                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: 'var(--text-primary)' }}>
                                    Part {currentStep + 1}: {demoSteps[currentStep].title}
                                </h4>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                                    Duration: {demoSteps[currentStep].duration}
                                </p>
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '1rem'
                        }}>
                            {demoSteps[currentStep].features.map((feature, index) => (
                                <div
                                    key={index}
                                    style={{
                                        padding: '1rem',
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderRadius: '0.75rem',
                                        display: 'flex',
                                        gap: '1rem',
                                        alignItems: 'flex-start'
                                    }}
                                >
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '0.5rem',
                                        backgroundColor: 'var(--bg-card)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--primary)',
                                        flexShrink: 0
                                    }}>
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.925rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                            {feature.name}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {feature.description}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Navigation Buttons */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '2rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid var(--border-color)'
                        }}>
                            <button
                                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                                className="btn"
                                style={{
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-card)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    opacity: currentStep === 0 ? 0.5 : 1
                                }}
                                disabled={currentStep === 0}
                            >
                                <ArrowLeft size={18} /> Previous
                            </button>
                            <button
                                onClick={() => setCurrentStep(prev => Math.min(demoSteps.length - 1, prev + 1))}
                                className="btn btn-primary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    opacity: currentStep === demoSteps.length - 1 ? 0.5 : 1
                                }}
                                disabled={currentStep === demoSteps.length - 1}
                            >
                                Next <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Quick Access Buttons */}
                <section style={{ marginBottom: '4rem' }}>
                    <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        Quick Access
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem'
                    }}>
                        <button
                            onClick={() => handleNavigate('/login')}
                            className="card"
                            style={{
                                padding: '1.5rem',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.75rem',
                                transition: 'transform 0.2s'
                            }}
                        >
                            <Lock size={28} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Login Page</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/login</span>
                        </button>
                        <button
                            onClick={() => handleNavigate('/')}
                            className="card"
                            style={{
                                padding: '1.5rem',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.75rem',
                                transition: 'transform 0.2s'
                            }}
                        >
                            <Users size={28} style={{ color: 'var(--success)' }} />
                            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Register</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/</span>
                        </button>
                        <button
                            onClick={() => handleNavigate('/admin')}
                            className="card"
                            style={{
                                padding: '1.5rem',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.75rem',
                                transition: 'transform 0.2s'
                            }}
                        >
                            <Monitor size={28} style={{ color: 'var(--warning)' }} />
                            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Admin Dashboard</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/admin</span>
                        </button>
                        <button
                            onClick={() => handleNavigate('/candidate')}
                            className="card"
                            style={{
                                padding: '1.5rem',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.75rem',
                                transition: 'transform 0.2s'
                            }}
                        >
                            <Bot size={28} style={{ color: 'var(--error)' }} />
                            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Candidate Home</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/candidate</span>
                        </button>
                    </div>
                </section>

                {/* Anti-Fraud Highlight */}
                <section className="card" style={{
                    padding: '2rem',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.1) 100%)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    marginBottom: '2rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '1rem',
                            backgroundColor: 'var(--error)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <AlertTriangle size={32} />
                        </div>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                Advanced Anti-Fraud Protection
                            </h4>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Our system ensures interview integrity with multiple layers of fraud detection:
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                {[
                                    'Face Registration & Verification',
                                    'Tab Switch Detection (5 strikes)',
                                    'Screen Sharing Required',
                                    'Periodic Screenshot Capture',
                                    'Auto-Block on Violations',
                                    'Full Audit Trail'
                                ].map((item, index) => (
                                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer style={{
                backgroundColor: 'var(--bg-card)',
                borderTop: '1px solid var(--border-color)',
                padding: '1.5rem 2rem',
                textAlign: 'center'
            }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    NvestCareers AI Interview System - Built for efficient and fair hiring
                </p>
            </footer>
        </div>
    );
};

export default DemoPage;
