import React, { useState, useEffect } from 'react';
import { X, Calendar, Image as ImageIcon, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../services/endpoints';
import { showToast } from '../../utils/toast';

interface ScreenshotViewerModalProps {
    candidateId: string;
    candidateName: string;
    onClose: () => void;
}

interface ScreenshotMetadata {
    _id: string;
    timestamp: string;
    createdAt: string;
    type?: string;
}

const ScreenshotViewerModal: React.FC<ScreenshotViewerModalProps> = ({ candidateId, candidateName, onClose }) => {
    const [screenshots, setScreenshots] = useState<ScreenshotMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedScreenshotId, setSelectedScreenshotId] = useState<string | null>(null);
    const [imageData, setImageData] = useState<string | null>(null);
    const [loadingImage, setLoadingImage] = useState(false);

    useEffect(() => {
        fetchScreenshots();
    }, [candidateId]);

    const fetchScreenshots = async () => {
        setLoading(true);
        try {
            const res = await api.get(API_ENDPOINTS.FACE.SCREENSHOTS(candidateId));
            const screenshotsList = res.data.screenshots || [];
            setScreenshots(screenshotsList);
            
            // Auto-select first screenshot if available
            if (screenshotsList.length > 0) {
                fetchScreenshotImage(screenshotsList[0]._id);
            }
        } catch (err) {
            console.error('Failed to fetch screenshots', err);
            showToast.error('Failed to load screenshots list');
        } finally {
            setLoading(false);
        }
    };

    const fetchScreenshotImage = async (id: string) => {
        setLoadingImage(true);
        setSelectedScreenshotId(id);
        setImageData(null);
        try {
            const res = await api.get(API_ENDPOINTS.FACE.SCREENSHOT_BY_ID(id));
            setImageData(res.data.image);
        } catch (err) {
            console.error('Failed to fetch image', err);
            showToast.error('Failed to load image');
        } finally {
            setLoadingImage(false);
        }
    };

    const handleNext = () => {
        if (!selectedScreenshotId) return;
        const currentIndex = screenshots.findIndex(s => s._id === selectedScreenshotId);
        if (currentIndex < screenshots.length - 1) {
            fetchScreenshotImage(screenshots[currentIndex + 1]._id);
        }
    };

    const handlePrev = () => {
        if (!selectedScreenshotId) return;
        const currentIndex = screenshots.findIndex(s => s._id === selectedScreenshotId);
        if (currentIndex > 0) {
            fetchScreenshotImage(screenshots[currentIndex - 1]._id);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '900px', height: '80vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Screenshots: {candidateName}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Sidebar List */}
                    <div style={{ width: '250px', borderRight: '1px solid var(--border-color)', overflowY: 'auto', backgroundColor: 'var(--bg-secondary)' }}>
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center' }}><Loader className="animate-spin" /></div>
                        ) : screenshots.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No screenshots found.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {screenshots.map((s, index) => (
                                    <button
                                        key={s._id}
                                        onClick={() => fetchScreenshotImage(s._id)}
                                        style={{
                                            padding: '1rem',
                                            border: 'none',
                                            borderBottom: '1px solid var(--border-color)',
                                            background: selectedScreenshotId === s._id ? 'var(--bg-primary)' : 'transparent',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            gap: '0.75rem',
                                            alignItems: 'flex-start',
                                            borderLeft: selectedScreenshotId === s._id ? '3px solid var(--primary)' : '3px solid transparent'
                                        }}
                                    >
                                        <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}><ImageIcon size={16} /></div>
                                        <div>
                                            <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>Capture #{index + 1}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                                                <Calendar size={12} />
                                                {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                                {new Date(s.timestamp).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Main Image View */}
                    <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', position: 'relative' }}>
                        {selectedScreenshotId ? (
                            <>
                                {loadingImage ? (
                                    <div style={{ color: 'white' }}><Loader className="animate-spin" size={32} /></div>
                                ) : imageData ? (
                                    <img 
                                        src={imageData} 
                                        alt="Screenshot" 
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }} 
                                    />
                                ) : (
                                    <div style={{ color: 'white' }}>Failed to load image</div>
                                )}

                                {/* Navigation Controls */}
                                <div style={{ position: 'absolute', bottom: '1rem', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                    <button 
                                        className="btn" 
                                        onClick={handlePrev}
                                        disabled={screenshots.findIndex(s => s._id === selectedScreenshotId) === 0}
                                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}
                                    >
                                        <ChevronLeft size={20} /> Prev
                                    </button>
                                    <button 
                                        className="btn" 
                                        onClick={handleNext}
                                        disabled={screenshots.findIndex(s => s._id === selectedScreenshotId) === screenshots.length - 1}
                                        style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}
                                    >
                                        Next <ChevronRight size={20} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                                <ImageIcon size={48} style={{ marginBottom: '1rem' }} />
                                <div>Select a screenshot from the list to view</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScreenshotViewerModal;
