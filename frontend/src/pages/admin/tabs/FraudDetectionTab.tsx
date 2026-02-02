import React from 'react';
import FraudDetectionPanel from '../../../components/FraudDetectionPanel';

interface FraudDetectionTabProps {
    alerts: any[];
    stats: any;
    total: number;
    page: number;
    onPageChange: (page: number) => void;
    onUpdateAlert: (id: string, status: string, notes?: string) => void;
    onDeleteAlert: (id: string) => void;
    onRefresh: () => void;
}

const FraudDetectionTab: React.FC<FraudDetectionTabProps> = ({
    alerts,
    stats,
    total,
    page,
    onPageChange,
    onUpdateAlert,
    onDeleteAlert,
    onRefresh
}) => {
    return (
        <FraudDetectionPanel
            alerts={alerts}
            stats={stats}
            totalAlerts={total}
            page={page}
            onPageChange={onPageChange}
            onUpdateAlert={onUpdateAlert}
            onDeleteAlert={onDeleteAlert}
            onRefresh={onRefresh}
        />
    );
};

export default FraudDetectionTab;
