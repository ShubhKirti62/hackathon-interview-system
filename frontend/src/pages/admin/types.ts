export interface Candidate {
    _id: string;
    name: string;
    email: string;
    domain: string;
    experienceLevel: string;
    status: string;
    createdAt: string;
    internalReferred: boolean;
    resumeUrl?: string;
    resumeText?: string;
    phone?: string;
    remarks?: string;
    handledBy?: {
        name: string;
        role: string;
    };
    overallScore?: number;
    blocked?: boolean;
    createdBy?: string;
}

export interface Setting {
    key: string;
    value: number;
    description: string;
}

export interface Question {
    _id: string;
    text: string;
    domain: string;
    experienceLevel: string;
    difficulty: string;
    type: 'Descriptive';
    verified: boolean;
    keywords?: string[];
}

export interface Stats {
    totalCandidates: number;
    interviewsCompleted: number;
    resumesProcessed: number;
    totalQuestions: number;
    totalHRs: number;
}

export interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}
