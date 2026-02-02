import React from 'react';
import { Users, BarChart as BarChartIcon, PieChart as PieChartIcon, Star, Filter, Trash2, Shield, Video, Upload } from 'lucide-react';
import { PieChart, Pie, Tooltip, Legend, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Candidate, Stats } from '../types';
import { formatCandidateStatus, getStatusColor, getStatusBackgroundColor } from '../../../utils/statusFormatter';
import StatCard from '../components/StatCard';

interface CandidatesTabProps {
    candidates: Candidate[];
    stats: Stats;
    filterReferred: boolean;
    setFilterReferred: (val: boolean) => void;
    handleDeleteAllCandidates: () => void;
    onView: (candidate: Candidate) => void;
    onEdit: (candidate: Candidate) => void;
    onDelete: (id: string) => void;
    onViewScreenshots: (id: string, name: string) => void;
    onViewInterview: (id: string) => void;
    chartData: {
        statusCounts: any[];
        domainCounts: any[];
        trendData: any[];
    };
}

const TableRow: React.FC<{
    candidate: Candidate,
    onView: () => void,
    onDelete: () => void,
    onEdit: () => void,
    onViewScreenshots: () => void,
    onViewInterview: (candidateId: string) => void
}> = ({ candidate, onView, onDelete, onEdit, onViewScreenshots, onViewInterview }) => {
    let statusColor = getStatusColor(candidate.status);
    let statusBg = getStatusBackgroundColor(candidate.status);
    let displayStatus = formatCandidateStatus(candidate.status);

    // Override if remarks indicate blocking but status is just Rejected
    if (candidate.blocked || (candidate.status && candidate.status.toLowerCase() === 'rejected' && candidate.remarks &&
        (candidate.remarks.toLowerCase().includes('blocked') ||
            candidate.remarks.toLowerCase().includes('violation') ||
            candidate.remarks.toLowerCase().includes('fraud')))) {
        displayStatus = 'Blocked';
        statusColor = 'var(--error)';
        statusBg = 'rgba(220, 38, 38, 0.2)';
    }

    return (
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>{candidate.name}</td>
            <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{candidate.email}</td>
            <td style={{ padding: '0.75rem' }}>{candidate.domain}</td>
            <td style={{ padding: '0.75rem' }}>{candidate.experienceLevel}</td>
            <td style={{ padding: '0.75rem' }}>
                <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.875rem',
                    backgroundColor: statusBg,
                    color: statusColor,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '150px',
                    display: 'inline-block'
                }}>
                    {displayStatus}
                </span>
            </td>
            <td style={{ padding: '0.75rem' }}>
                {candidate.internalReferred ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--warning)' }}>
                        <Star size={14} fill="var(--warning)" />
                        <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Referred</span>
                    </div>
                ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Direct</span>
                )}
            </td>
            <td style={{ padding: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={onView}
                        style={{ color: 'var(--primary)', background: 'none', border: 'none', fontSize: '0.875rem', cursor: 'pointer' }}
                        title="View Details"
                    >
                        View
                    </button>
                    {displayStatus !== 'Blocked' && (
                        <button
                            onClick={onEdit}
                            style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', fontSize: '0.875rem', cursor: 'pointer' }}
                            title="Edit"
                        >
                            Edit
                        </button>
                    )}
                    <button
                        onClick={onViewScreenshots}
                        style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                        title="View Screenshots"
                    >
                        <Shield size={16} />
                    </button>
                    {candidate.status === 'Interviewed' && (
                        <button
                            onClick={() => onViewInterview(candidate._id)}
                            style={{ color: 'var(--success)', background: 'none', border: 'none', cursor: 'pointer' }}
                            title="View Interview Details"
                        >
                            <Video size={16} />
                        </button>
                    )}
                    <button
                        onClick={onDelete}
                        style={{ color: 'var(--error)', background: 'none', border: 'none', fontSize: '0.875rem', cursor: 'pointer' }}
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

const CandidatesTab: React.FC<CandidatesTabProps> = ({
    candidates,
    stats,
    filterReferred,
    setFilterReferred,
    handleDeleteAllCandidates,
    onView,
    onEdit,
    onDelete,
    onViewScreenshots,
    onViewInterview,
    chartData
}) => {
    return (
        <>
            <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard icon={<Users />} label="Total Candidates" value={stats.totalCandidates.toString()} />
                <StatCard icon={<BarChartIcon />} label="Interviews Completed" value={stats.interviewsCompleted.toString()} />
                <StatCard icon={<Upload />} label="Resumes Processed" value={stats.resumesProcessed.toString()} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card admin-chart-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <PieChartIcon size={20} style={{ color: 'var(--primary)' }} />
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Candidate Status</h3>
                    </div>
                    {chartData.statusCounts.length > 0 ? (
                        <PieChart width={350} height={280}>
                            <Pie
                                data={chartData.statusCounts}
                                cx={175}
                                cy={120}
                                innerRadius={50}
                                outerRadius={90}
                                paddingAngle={chartData.statusCounts.length > 1 ? 3 : 0}
                                dataKey="value"
                                nameKey="name"
                            />
                            <Tooltip />
                            <Legend verticalAlign="bottom" />
                        </PieChart>
                    ) : (
                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                            No candidate data available
                        </div>
                    )}
                </div>
                <div className="card admin-chart-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <PieChartIcon size={20} style={{ color: 'var(--primary)' }} />
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Candidates by Domain</h3>
                    </div>
                    {chartData.domainCounts.length > 0 ? (
                        <ReBarChart width={350} height={250} data={chartData.domainCounts}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} />
                            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </ReBarChart>
                    ) : (
                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                            No domain data available
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                <div className="card" style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>Recent Candidates</h2>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setFilterReferred(!filterReferred)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: filterReferred ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                                    color: filterReferred ? 'var(--warning)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Filter size={16} />
                                {filterReferred ? 'Referred Only' : 'Filter by Referral'}
                            </button>
                            <button
                                onClick={handleDeleteAllCandidates}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--error)',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: 'var(--error)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Trash2 size={16} />
                                Clear All
                            </button>
                        </div>
                    </div>
                    {candidates.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                            No candidates found.
                        </p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Name</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Email</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Domain</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Experience</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Source</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {candidates
                                    .filter(c => filterReferred ? c.internalReferred : true)
                                    .map(candidate => (
                                        <TableRow
                                            key={candidate._id}
                                            candidate={candidate}
                                            onView={() => onView(candidate)}
                                            onDelete={() => onDelete(candidate._id)}
                                            onEdit={() => onEdit(candidate)}
                                            onViewScreenshots={() => onViewScreenshots(candidate._id, candidate.name)}
                                            onViewInterview={onViewInterview}
                                        />
                                    ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
};

export default CandidatesTab;
