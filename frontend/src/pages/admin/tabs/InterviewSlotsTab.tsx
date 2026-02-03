import React from 'react';
import { Calendar, CheckCircle, Users, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import { APP_ROUTES } from '../../../routes';

interface InterviewSlotsTabProps {
    slots: any[];
    onFeedback: (slot: any) => void;
    onEditSlot?: (slot: any) => void;
}

const InterviewSlotsTab: React.FC<InterviewSlotsTabProps> = ({ slots, onFeedback, onEditSlot }) => {
    const navigate = useNavigate();
    const [now, setNow] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <>
            <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard icon={<Calendar />} label="Total Slots" value={slots.length.toString()} />
                <StatCard icon={<CheckCircle />} label="Available Slots" value={slots.filter(s => s.status === 'Available').length.toString()} />
                <StatCard icon={<Users />} label="Booked Slots" value={slots.filter(s => s.status === 'Booked').length.toString()} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                <div className="card" style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Upcoming Interviews</h2>
                    </div>
                    {slots.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                            No slots created yet. Click "Create Slot" to schedule interviews.
                        </p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Interviewer</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Date</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Time</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Candidate</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slots.map(slot => (
                                    <tr key={slot._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '0.75rem' }}>{slot.interviewerId?.name}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {new Date(slot.startTime).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {new Date(slot.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{slot.candidateId?.name || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Unbooked</span>}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '999px',
                                                fontSize: '0.7rem',
                                                backgroundColor: slot.status === 'Available' ? 'rgba(59, 130, 246, 0.1)' : slot.status === 'Booked' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                                color: slot.status === 'Available' ? 'var(--primary)' : slot.status === 'Booked' ? 'var(--warning)' : 'var(--success)'
                                            }}>
                                                {slot.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                {/* Edit button - only for available slots */}
                                                {slot.status === 'Available' && (
                                                    <button
                                                        onClick={() => onEditSlot && onEditSlot(slot)}
                                                        style={{ 
                                                            color: 'var(--text-secondary)', 
                                                            background: 'none', 
                                                            border: 'none', 
                                                            cursor: 'pointer', 
                                                            fontSize: '0.8rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem'
                                                        }}
                                                        title="Edit Slot"
                                                    >
                                                        <Edit size={14} />
                                                        Edit
                                                    </button>
                                                )}
                                                
                                                {/* Action buttons for booked slots */}
                                                {slot.status === 'Booked' && (() => {
                                                    const startTime = new Date(slot.startTime).getTime();
                                                    const endTime = new Date(slot.endTime).getTime();
                                                    const isTimeToJoin = now.getTime() >= startTime && now.getTime() <= endTime;

                                                    return (
                                                        <>
                                                            {isTimeToJoin && (
                                                                <button
                                                                    onClick={() => navigate(APP_ROUTES.INTERVIEW.MEETING.replace(':id', slot._id))}
                                                                    style={{
                                                                        color: 'white',
                                                                        fontSize: '0.8rem',
                                                                        fontWeight: 'bold',
                                                                        backgroundColor: 'var(--success)',
                                                                        border: 'none',
                                                                        padding: '0.4rem 0.8rem',
                                                                        borderRadius: '0.5rem',
                                                                        cursor: 'pointer',
                                                                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)'
                                                                    }}
                                                                >
                                                                    Join Live Interview
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => onFeedback(slot)}
                                                                style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                                            >
                                                                Enter Feedback
                                                            </button>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
};

export default InterviewSlotsTab;
