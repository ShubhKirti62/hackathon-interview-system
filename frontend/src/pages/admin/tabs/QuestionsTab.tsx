import React from 'react';
import { FileText, File, Edit, Trash2 } from 'lucide-react';
import type { Question, Stats } from '../types';
import StatCard from '../components/StatCard';

interface QuestionsTabProps {
    questions: Question[];
    stats: Stats;
    onEdit: (question: Question) => void;
    onDelete: (id: string) => void;
}

const QuestionsTab: React.FC<QuestionsTabProps> = ({ questions, stats, onEdit, onDelete }) => {
    return (
        <>
            <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard icon={<FileText />} label="Total Questions" value={stats.totalQuestions.toString()} />
                <StatCard icon={<File />} label="Descriptive Questions" value={questions.length.toString()} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {questions.map(question => (
                    <div key={question._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                backgroundColor: question.difficulty === 'Easy' ? 'rgba(34, 197, 94, 0.1)' :
                                    question.difficulty === 'Medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: question.difficulty === 'Easy' ? 'var(--success)' :
                                    question.difficulty === 'Medium' ? 'var(--warning)' : 'var(--error)',
                                fontWeight: '600'
                            }}>
                                {question.difficulty}
                            </span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => onEdit(question)}
                                    style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => onDelete(question._id)}
                                    style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <p style={{ margin: '0 0 1rem 0', flex: 1, lineHeight: '1.5', color: 'var(--text-primary)' }}>
                            {question.text}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 'auto' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                {question.domain}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                {question.experienceLevel}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                                {question.type}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            {questions.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem', backgroundColor: 'var(--bg-card)', borderRadius: '0.75rem', border: '1px dashed var(--border-color)' }}>
                    No questions found. Add some to get started.
                </div>
            )}
        </>
    );
};

export default QuestionsTab;
