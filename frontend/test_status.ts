import { formatCandidateStatus, getStatusColor } from './src/utils/statusFormatter';

console.log("Testing status formatter:");
console.log("'blocked' ->", formatCandidateStatus('blocked'));
console.log("'Blocked' ->", formatCandidateStatus('Blocked'));
console.log("'account_blocked' ->", formatCandidateStatus('account_blocked'));
console.log("'Account Blocked' ->", formatCandidateStatus('Account Blocked'));
console.log("'rejected' ->", formatCandidateStatus('rejected'));
console.log("'Rejected' ->", formatCandidateStatus('Rejected'));
