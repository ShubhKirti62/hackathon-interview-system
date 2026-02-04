import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, UserPlus, LogIn, Video, Sparkles, MonitorSmartphone, X, ChevronLeft, ChevronRight, Presentation, Shield, ScanFace, Code, FileSearch, ChartBar } from 'lucide-react';
import { APP_ROUTES } from '../routes'; // Adjust path if needed, routes is at src/routes.ts
import './DemoPage.css';

const DemoPage = () => {
    const navigate = useNavigate();
    const [isPresentationMode, setIsPresentationMode] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            title: "Hackathon Interview System",
            subtitle: "Revolutionizing Remote Hiring with AI & Security",
            icon: <Sparkles size={80} color="#fbbf24" />,
            content: (
                <div className="slide-content-center">
                    <p>A comprehensive platform for conducting secure, automated, and efficient technical interviews.</p>
                </div>
            )
        },
        {
            title: "The Problem",
            subtitle: "Challenges in Modern Remote Hiring",
            icon: <FileSearch size={64} className="text-red-500" />,
            content: (
                <ul className="slide-list">
                    <li><strong>Proxy Candidates:</strong> Impersonators taking tests for others.</li>
                    <li><strong>Lack of Integrity:</strong> Traditional tools lack robust proctoring.</li>
                    <li><strong>Inefficient Process:</strong> Manual scheduling and evaluation is slow.</li>
                    <li><strong>Fragmented Tools:</strong> Separate video, coding, and whiteboard apps.</li>
                </ul>
            )
        },
        {
            title: "Our Solution",
            subtitle: "An Integrated, Secure Ecosystem",
            icon: <MonitorSmartphone size={64} className="text-blue-500" />,
            content: (
                <div className="slide-content-center">
                    <p>We combine <strong>Video Conferencing</strong>, <strong>Real-time Collaborative Coding</strong>, and <strong>AI-Driven Security</strong> into a single seamless experience.</p>
                </div>
            )
        },
        {
            title: "Feature: Secure Authentication",
            subtitle: "Zero Trust verification",
            icon: <ScanFace size={64} className="text-green-500" />,
            content: (
                <ul className="slide-list">
                    <li><strong>Face Registration:</strong> Candidates register their biometrics before starting.</li>
                    <li><strong>Liveness Detection:</strong> Ensures the user is a real person, not a photo.</li>
                    <li><strong>Continuous Verification:</strong> Periodic face checks during the interview.</li>
                </ul>
            )
        },
        {
            title: "Feature: AI Smart Proctoring",
            subtitle: "Automated Fraud Detection",
            icon: <Shield size={64} className="text-purple-500" />,
            content: (
                <ul className="slide-list">
                    <li><strong>Gaze Tracking:</strong> Detects if the candidate looks away frequently.</li>
                    <li><strong>Multi-Face Detection:</strong> Alerts if multiple people are in the frame.</li>
                    <li><strong>Tab Switch Monitoring:</strong> Tracks when candidates leave the interview window.</li>
                    <li><strong>Real-time Alerts:</strong> Instant notifications for the interviewer.</li>
                </ul>
            )
        },
        {
            title: "Feature: Live Technical Interview",
            subtitle: "Collaborate in Real-time",
            icon: <Code size={64} className="text-orange-500" />,
            content: (
                <ul className="slide-list">
                    <li><strong>Shared Code Editor:</strong> Syntax highlighting for multiple languages.</li>
                    <li><strong>Integrated Compiler:</strong> Run code instantly within the browser.</li>
                    <li><strong>Collaborative Whiteboard:</strong> Draw and visualize system designs together.</li>
                    <li><strong>Video & Audio:</strong> Low-latency communication built-in.</li>
                </ul>
            )
        },
        {
            title: "Feature: Admin & Reporting",
            subtitle: "Data-Driven Decisions",
            icon: <ChartBar size={64} className="text-teal-500" />,
            content: (
                <ul className="slide-list">
                    <li><strong>Comprehensive Dashboard:</strong> Manage candidates, questions, and rounds.</li>
                    <li><strong>Automated Scorecards:</strong> AI-generated summaries of performance.</li>
                    <li><strong>Detailed Logs:</strong> Full audit trail of proctoring violations.</li>
                </ul>
            )
        },
        {
            title: "Ready for Demo?",
            subtitle: "Let's see it in action.",
            icon: <LayoutDashboard size={80} className="text-indigo-500" />,
            content: (
                <div className="slide-content-center">
                    <p>Select a flow below to start the live demonstration.</p>
                    <button className="demo-btn" style={{ marginTop: '2rem', width: 'auto', padding: '1rem 3rem' }} onClick={() => setIsPresentationMode(false)}>
                        Start Live Demo
                    </button>
                </div>
            )
        }
    ];

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) setCurrentSlide(curr => curr + 1);
    };

    const prevSlide = () => {
        if (currentSlide > 0) setCurrentSlide(curr => curr - 1);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isPresentationMode) return;
        if (e.key === 'ArrowRight' || e.key === 'Space') nextSlide();
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'Escape') setIsPresentationMode(false);
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPresentationMode, currentSlide]);


    const demoCards = [
        {
            title: 'Admin Dashboard',
            description: 'Access the administrative control panel to manage candidates, questions, and view interview results.',
            icon: <LayoutDashboard size={32} />,
            action: () => navigate(APP_ROUTES.ADMIN.DASHBOARD),
            buttonText: 'Open Dashboard',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            title: 'Candidate Register',
            description: 'Simulate a new candidate registration flow with face verification setup.',
            icon: <UserPlus size={32} />,
            action: () => navigate(APP_ROUTES.REGISTER), // Assuming '/' is Register
            buttonText: 'Start Registration',
            color: 'from-green-500 to-emerald-500'
        },
        {
            title: 'Candidate Login',
            description: 'Log in as an existing candidate to continue an interview or view dashboard.',
            icon: <LogIn size={32} />,
            action: () => navigate(APP_ROUTES.LOGIN),
            buttonText: 'Login Candidate',
            color: 'from-purple-500 to-pink-500'
        },
        {
            title: 'Interview Session',
            description: 'Jump directly to the interview introduction page (requires login).',
            icon: <Video size={32} />,
            action: () => navigate(APP_ROUTES.INTERVIEW.INTRO),
            buttonText: 'Start Interview',
            color: 'from-orange-500 to-red-500'
        }
    ];

    return (
        <div className="demo-page">
            <div className="floating-shapes">
                <div className="shape-1"></div>
                <div className="shape-2"></div>
                <div className="shape-3"></div>
            </div>

            <header className="demo-header">
                <div>
                    <Sparkles className="animate-float" style={{ color: '#fbbf24', marginBottom: '1rem' }} size={48} />
                </div>
                <h1 className="demo-title">Hackathon Interview System</h1>
                <p className="demo-subtitle">
                    Welcome to the 15-minute demo portal. Select a flow below to demonstrate the key capabilities of the system.
                </p>
                <button
                    className="presentation-trigger-btn"
                    onClick={() => {
                        setCurrentSlide(0);
                        setIsPresentationMode(true);
                    }}
                >
                    <Presentation size={20} />
                    Start Presentation Mode
                </button>
            </header>

            {isPresentationMode && (
                <div className="presentation-overlay">
                    <button className="close-presentation" onClick={() => setIsPresentationMode(false)}>
                        <X size={32} />
                    </button>

                    <div className="slide-container">
                        <div className="slide-content">
                            <div className="slide-icon-wrapper">
                                {slides[currentSlide].icon}
                            </div>
                            <h2 className="slide-title">{slides[currentSlide].title}</h2>
                            <h3 className="slide-subtitle">{slides[currentSlide].subtitle}</h3>
                            <div className="slide-body">
                                {slides[currentSlide].content}
                            </div>
                        </div>
                    </div>

                    <div className="slide-controls">
                        <button className="nav-btn" onClick={prevSlide} disabled={currentSlide === 0}>
                            <ChevronLeft size={32} />
                        </button>
                        <div className="slide-indicator">
                            {currentSlide + 1} / {slides.length}
                        </div>
                        <button className="nav-btn" onClick={nextSlide} disabled={currentSlide === slides.length - 1}>
                            <ChevronRight size={32} />
                        </button>
                    </div>
                </div>
            )}

            <div className="demo-grid">
                {demoCards.map((card, index) => (
                    <div key={index} className="demo-card" onClick={card.action}>
                        <div className="demo-card-icon">
                            {card.icon}
                        </div>
                        <h3 className="demo-card-title">{card.title}</h3>
                        <p className="demo-card-desc">{card.description}</p>
                        <button className="demo-btn">
                            {card.buttonText}
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '3rem', zIndex: 10, textAlign: 'center', opacity: 0.7 }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <MonitorSmartphone size={16} />
                    Optimized for 1080p Demo Presentations
                </p>
            </div>
        </div>
    );
};

export default DemoPage;
