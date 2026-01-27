// Status formatting utilities for candidate display

// Normalize status to snake_case for consistent lookup
const normalizeStatus = (status: string): string => {
    if (!status) return '';
    // If already snake_case, return as-is
    if (status.includes('_')) return status.toLowerCase();
    // Convert PascalCase/spaces to snake_case: "Profile Submitted" -> "profile_submitted"
    return status
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/\s+/g, '_')
        .toLowerCase();
};

export const formatCandidateStatus = (status: string): string => {
    const statusMap: { [key: string]: string } = {
        'profile_submitted': 'Profile Submitted',
        'profile submitted': 'Profile Submitted',
        'interview_1st_round_pending': 'Interview 1st Round Pending',
        '1st_round_completed': '1st Round Completed',
        '2nd_round_qualified': '2nd Round Qualified',
        'rejected': 'Rejected',
        'blocked': 'Blocked',
        'slot_booked': 'Slot Booked',
        'interviewed': 'Interviewed',
        'round_2_completed': 'Round 2 Completed',
        'offer_letter_sent': 'Offer Letter Sent'
    };

    const normalized = normalizeStatus(status);
    return statusMap[normalized] || statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
    const colorMap: { [key: string]: string } = {
        'profile_submitted': 'var(--text-secondary)',
        'interview_1st_round_pending': 'var(--warning)',
        '1st_round_completed': 'var(--primary)',
        '2nd_round_qualified': 'var(--success)',
        'rejected': 'var(--error)',
        'blocked': 'var(--error)',
        'slot_booked': 'var(--primary)',
        'interviewed': 'var(--primary)',
        'round_2_completed': 'var(--success)',
        'offer_letter_sent': 'var(--success)'
    };

    const normalized = normalizeStatus(status);
    return colorMap[normalized] || colorMap[status] || 'var(--text-secondary)';
};

export const getStatusBackgroundColor = (status: string): string => {
    const bgMap: { [key: string]: string } = {
        'profile_submitted': 'rgba(107, 114, 128, 0.1)',
        'interview_1st_round_pending': 'rgba(251, 146, 60, 0.1)',
        '1st_round_completed': 'rgba(59, 130, 246, 0.1)',
        '2nd_round_qualified': 'rgba(34, 197, 94, 0.1)',
        'rejected': 'rgba(239, 68, 68, 0.1)',
        'blocked': 'rgba(220, 38, 38, 0.2)',
        'slot_booked': 'rgba(59, 130, 246, 0.1)',
        'interviewed': 'rgba(59, 130, 246, 0.1)',
        'round_2_completed': 'rgba(34, 197, 94, 0.1)',
        'offer_letter_sent': 'rgba(34, 197, 94, 0.1)'
    };

    const normalized = normalizeStatus(status);
    return bgMap[normalized] || bgMap[status] || 'rgba(107, 114, 128, 0.1)';
};
