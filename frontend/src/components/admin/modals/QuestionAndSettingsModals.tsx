import React, { useState, useEffect } from 'react';
import { X, File, AlertCircle } from 'lucide-react';
import api from '../../../services/api';
import { API_ENDPOINTS } from '../../../services/endpoints';
import { showToast } from '../../../utils/toast';
import type { Question, Setting } from '../../../pages/admin/types';

export const AddQuestionModal: React.FC<{ onClose: () => void, onSuccess: () => void, existingQuestion: Question | null }> = ({ onClose, onSuccess, existingQuestion }) => {
    const [formData, setFormData] = useState({
        text: existingQuestion?.text || '',
        domain: existingQuestion?.domain || 'Frontend',
        experienceLevel: existingQuestion?.experienceLevel || 'Fresher/Intern',
        difficulty: existingQuestion?.difficulty || 'Medium',
        type: 'Descriptive' as const,
        keywords: existingQuestion?.keywords?.join(', ') || ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                type: 'Descriptive',
                keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
            };

            if (existingQuestion) await api.patch(`${API_ENDPOINTS.QUESTIONS.BASE}/${existingQuestion._id}`, payload);
            else await api.post(API_ENDPOINTS.QUESTIONS.BASE, payload);
            onSuccess();
            onClose();
        } catch (err) {
            showToast.error('Failed to save question');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-color)',
                    zIndex: 10
                }}>
                    <h2 style={{ margin: 0 }}>{existingQuestion ? 'Edit' : 'Add'} Question</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    <form id="question-form" onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Question Text</label>
                            <textarea className="input" placeholder="Type your question here..." required value={formData.text} onChange={e => setFormData({ ...formData, text: e.target.value })} style={{ minHeight: '120px', resize: 'vertical' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Domain</label>
                                <select className="input" value={formData.domain} onChange={e => setFormData({ ...formData, domain: e.target.value })}>
                                    <option value="Frontend">Frontend</option>
                                    <option value="Backend">Backend</option>
                                    <option value="Full Stack">Full Stack</option>
                                    <option value="Sales & Marketing">Sales & Marketing</option>
                                    <option value="Business Analyst">Business Analyst</option>
                                    <option value="Data Science">Data Science</option>
                                    <option value="DevOps">DevOps</option>
                                    <option value="QA/Testing">QA/Testing</option>
                                    <option value="UI/UX Design">UI/UX Design</option>
                                    <option value="Product Management">Product Management</option>
                                    <option value="HR">HR</option>
                                    <option value="Finance">Finance</option>
                                    <option value="Operations">Operations</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Difficulty</label>
                                <select className="input" value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })}>
                                    <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                                Mandatory Keywords / Concepts <span style={{ fontSize: '0.7em', color: 'var(--primary)' }}>(AI Grading)</span>
                            </label>
                            <input
                                className="input"
                                placeholder="e.g. Virtual DOM, State, Props (comma separated)"
                                value={formData.keywords}
                                onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                            />
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                The AI will check for these specific terms when evaluating answers.
                            </div>
                        </div>
                    </form>
                </div>

                <div style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border-color)',
                    textAlign: 'right'
                }}>
                    <button type="submit" form="question-form" className="btn btn-primary" style={{ minWidth: '150px' }} disabled={loading}>
                        {loading ? 'Saving...' : existingQuestion ? 'Update Question' : 'Save Question'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [settings, setSettings] = useState<Setting[]>([]);
    const [draftValues, setDraftValues] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get(API_ENDPOINTS.SETTINGS.BASE).then(res => {
            setSettings(res.data);
            const initialDraft: Record<string, number> = {};
            res.data.forEach((s: Setting) => {
                initialDraft[s.key] = s.value;
            });
            setDraftValues(initialDraft);
        });
    }, []);

    const handleDraftUpdate = (key: string, value: string) => {
        setDraftValues(prev => ({ ...prev, [key]: parseInt(value) || 0 }));
    };

    const handleSaveAll = async () => {
        // Validation: Min 60 seconds for all
        const invalidKeys = Object.entries(draftValues).filter(([_, val]) => val < 60);
        if (invalidKeys.length > 0) {
            showToast.error('Time limits must be at least 60 seconds');
            return;
        }

        setSaving(true);
        try {
            await Promise.all(
                Object.entries(draftValues).map(([key, value]) =>
                    api.post(API_ENDPOINTS.SETTINGS.BASE, { key, value })
                )
            );
            showToast.success('All settings saved successfully!');
            onClose();
        } catch (err) {
            showToast.error('Failed to save some settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-color)',
                    zIndex: 10
                }}>
                    <h2 style={{ margin: 0 }}>System Settings</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1rem' }}>
                        {settings.length > 0 ? (
                            settings.map(s => {
                                const displayKey = s.key
                                    .replace('time_limit_', '')
                                    .split('_')
                                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(' ') + ' Time Limit (Sec)';

                                return (
                                    <div key={s.key} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1.25rem',
                                        backgroundColor: 'var(--bg-secondary)',
                                        borderRadius: '0.75rem',
                                        border: draftValues[s.key] < 60 ? '1px solid var(--error)' : '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>
                                                {displayKey}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: draftValues[s.key] < 60 ? 'var(--error)' : 'var(--text-secondary)' }}>
                                                {draftValues[s.key] < 60 ? 'Minimum limit is 60 seconds' : (s.description || `Adjust time limit for ${s.key.split('_').pop()} level questions.`)}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="number"
                                                className="input"
                                                style={{ width: '90px', fontWeight: 'bold', textAlign: 'center' }}
                                                value={draftValues[s.key] ?? s.value}
                                                onChange={e => handleDraftUpdate(s.key, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                Loading settings...
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <button
                        onClick={handleSaveAll}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={saving || settings.length === 0}
                    >
                        {saving ? 'Saving...' : 'Save All Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const BulkUploadModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const handleUpload = async () => {
        if (!file) return;
        const fd = new FormData(); fd.append('file', file);
        try {
            await api.post(API_ENDPOINTS.QUESTIONS.BULK_UPLOAD, fd);
            showToast.success('Questions uploaded successfully!');
            onSuccess();
            onClose();
        } catch (err) {
            showToast.error('Upload failed');
        }
    };
    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-color)',
                    zIndex: 10
                }}>
                    <h2 style={{ margin: 0 }}>Bulk Upload</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                    <div style={{ padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '0.5rem' }}>
                            <AlertCircle size={16} /> Instructions
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                            Please upload an Excel file with the following columns in the first row:
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                            {['Text', 'Difficulty', 'Type'].map(col => (
                                <span key={col} style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'monospace' }}>
                                    {col}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div style={{ padding: '2rem', border: '2px dashed var(--border-color)', borderRadius: '0.75rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', marginBottom: '1rem' }}>
                        <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                            <File size={32} style={{ color: 'var(--primary)' }} />
                            <div style={{ fontWeight: '600' }}>Click to select spreadsheet</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Supported formats: .xlsx, .xls</div>
                            <input type="file" accept=".xlsx, .xls" onChange={e => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                        </label>
                        {file && <div style={{ marginTop: '1rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--success)' }}>Selected: {file.name}</div>}
                    </div>
                </div>
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <button onClick={handleUpload} className="btn btn-primary" style={{ width: '100%' }} disabled={!file}>
                        Start Upload
                    </button>
                </div>
            </div>
        </div>
    );
};
