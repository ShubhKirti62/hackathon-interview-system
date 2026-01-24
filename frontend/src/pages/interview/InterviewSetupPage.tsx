import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Camera, Mic, Monitor, ArrowRight, AlertCircle } from 'lucide-react';
import FaceCapture from '../../components/FaceCapture';
import { APP_ROUTES } from '../../routes';

type SetupStep = 'permissions' | 'face' | 'ready';

interface PermissionStatus {
    camera: boolean | null;
    microphone: boolean | null;
}

const InterviewSetupPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState<SetupStep>('permissions');
    const [permissions, setPermissions] = useState<PermissionStatus>({
        camera: null,
        microphone: null,
    });
    const [faceRegistered, setFaceRegistered] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check permissions on mount
    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        try {
            // Check camera
            const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraStream.getTracks().forEach(track => track.stop());
            setPermissions(prev => ({ ...prev, camera: true }));

            // Check microphone
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStream.getTracks().forEach(track => track.stop());
            setPermissions(prev => ({ ...prev, microphone: true }));

            setError(null);
        } catch (err) {
            console.error('Permission check failed:', err);
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError') {
                    setError('Please allow camera and microphone access to continue');
                } else {
                    setError('Failed to access camera/microphone. Please check your device.');
                }
            }
        }
    };

    const handlePermissionsContinue = () => {
        if (permissions.camera && permissions.microphone) {
            setCurrentStep('face');
        } else {
            checkPermissions();
        }
    };

    const handleFaceCaptureComplete = (success: boolean) => {
        if (success) {
            setFaceRegistered(true);
            setCurrentStep('ready');
        }
    };

    const handleSkipFace = () => {
        setCurrentStep('ready');
    };

    const handleStartInterview = () => {
        navigate(APP_ROUTES.INTERVIEW.SESSION.replace(':id', id || ''));
    };

    const renderPermissionsStep = () => (
        <div className="setup-step">
            <div className="setup-icon">
                <Monitor size={48} />
            </div>
            <h2>System Check</h2>
            <p className="setup-description">
                We need to verify your camera and microphone are working properly for the interview.
            </p>

            <div className="permission-checklist">
                <div className={`permission-item ${permissions.camera === true ? 'granted' : permissions.camera === false ? 'denied' : ''}`}>
                    <Camera size={24} />
                    <span>Camera Access</span>
                    {permissions.camera === true && <CheckCircle size={20} color="var(--success)" />}
                    {permissions.camera === false && <AlertCircle size={20} color="var(--error)" />}
                </div>

                <div className={`permission-item ${permissions.microphone === true ? 'granted' : permissions.microphone === false ? 'denied' : ''}`}>
                    <Mic size={24} />
                    <span>Microphone Access</span>
                    {permissions.microphone === true && <CheckCircle size={20} color="var(--success)" />}
                    {permissions.microphone === false && <AlertCircle size={20} color="var(--error)" />}
                </div>
            </div>

            {error && (
                <div className="setup-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <button
                className="btn btn-primary"
                onClick={handlePermissionsContinue}
                disabled={!permissions.camera || !permissions.microphone}
            >
                {permissions.camera && permissions.microphone ? (
                    <>
                        Continue <ArrowRight size={18} />
                    </>
                ) : (
                    'Grant Permissions'
                )}
            </button>
        </div>
    );

    const renderFaceStep = () => (
        <div className="setup-step">
            <FaceCapture
                candidateId={id || ''}
                onCaptureComplete={handleFaceCaptureComplete}
                onSkip={handleSkipFace}
            />
        </div>
    );

    const renderReadyStep = () => (
        <div className="setup-step">
            <div className="setup-icon success">
                <CheckCircle size={48} />
            </div>
            <h2>You're All Set!</h2>
            <p className="setup-description">
                Your system is ready for the interview. Here's what to expect:
            </p>

            <div className="ready-checklist">
                <div className="ready-item">
                    <CheckCircle size={20} color="var(--success)" />
                    <span>Camera and microphone are working</span>
                </div>
                {faceRegistered && (
                    <div className="ready-item">
                        <CheckCircle size={20} color="var(--success)" />
                        <span>Face registered for identity verification</span>
                    </div>
                )}
                <div className="ready-item">
                    <CheckCircle size={20} color="var(--success)" />
                    <span>You will be asked a series of technical questions</span>
                </div>
                <div className="ready-item">
                    <CheckCircle size={20} color="var(--success)" />
                    <span>Speak clearly into your microphone to answer</span>
                </div>
            </div>

            <div className="setup-tips">
                <h3>Tips for a great interview:</h3>
                <ul>
                    <li>Find a quiet, well-lit space</li>
                    <li>Look directly at the camera when speaking</li>
                    <li>Take your time to think before answering</li>
                    <li>Be concise and clear in your responses</li>
                </ul>
            </div>

            <button className="btn btn-primary btn-large" onClick={handleStartInterview}>
                Start Interview <ArrowRight size={20} />
            </button>
        </div>
    );

    return (
        <div className="interview-setup-container">
            <div className="setup-progress">
                <div className={`progress-step ${currentStep === 'permissions' ? 'active' : 'completed'}`}>
                    <div className="step-number">1</div>
                    <span>System Check</span>
                </div>
                <div className="progress-line" />
                <div className={`progress-step ${currentStep === 'face' ? 'active' : currentStep === 'ready' ? 'completed' : ''}`}>
                    <div className="step-number">2</div>
                    <span>Face Registration</span>
                </div>
                <div className="progress-line" />
                <div className={`progress-step ${currentStep === 'ready' ? 'active' : ''}`}>
                    <div className="step-number">3</div>
                    <span>Ready</span>
                </div>
            </div>

            <div className="setup-content">
                {currentStep === 'permissions' && renderPermissionsStep()}
                {currentStep === 'face' && renderFaceStep()}
                {currentStep === 'ready' && renderReadyStep()}
            </div>
        </div>
    );
};

export default InterviewSetupPage;
