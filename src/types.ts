export type Role = 'member' | 'admin';

export type SubmissionStatus = 'pending' | 'reviewed' | 'needs_resubmission';

export type ProgrammingLanguage =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'rust'
  | 'go'
  | 'java'
  | 'cpp'
  | 'sql'
  | 'html_css';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  title: string;
  badge?: string;
  authProvider?: 'google' | 'password' | 'local';
  emailVerified?: boolean;
  isSuperAdmin?: boolean;
  isCustomUser?: boolean;
  lastSeenAt?: string;
}

export interface AdminEntry {
  id: string;
  email: string;
  name: string;
  role?: 'admin' | 'super_admin';
  roleTitle?: string;
  addedAt: string;
  addedBy?: string;
  isPrimaryOwner?: boolean;
}

export interface RubricScores {
  correctness: number; // 0 - 40
  style: number;       // 0 - 30
  efficiency: number;  // 0 - 30
  total: number;       // 0 - 100
}

export interface Review {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  score: number;
  rubric: RubricScores;
  feedbackText: string;
  strengths: string[];
  improvements: string[];
  correctedCode: string;
  statusOutcome: 'reviewed' | 'needs_resubmission';
  reviewedAt: string;
}

export interface AiDetectionResult {
  aiProbability: number; // 0 - 100
  classification: 'Likely AI Generated' | 'Mixed / AI Assisted' | 'Likely Human Written';
  confidence: 'High' | 'Medium' | 'Low';
  breakdown: {
    predictabilityScore: number; // 0 - 100
    verbosityScore: number;      // 0 - 100
    structureUniformity: number; // 0 - 100
    heuristicEntropy: number;    // 0 - 100
  };
  detectedSignals: string[];
  humanSignals: string[];
  lineHighlights?: Array<{
    lineStart: number;
    lineEnd: number;
    reason: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  summary: string;
  analyzedAt: string;
}

export interface Submission {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar: string;
  title: string;
  language: ProgrammingLanguage;
  description: string;
  code: string;
  status: SubmissionStatus;
  submittedAt: string;
  review?: Review;
  aiDetection?: AiDetectionResult;
  resubmissionCount?: number;
  tags?: string[];
}

export interface MemberStats {
  totalSubmissions: number;
  reviewedCount: number;
  pendingCount: number;
  needsResubmissionCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  recentTrend: number; // difference between last 2 scores
}

export interface TeamMemberRanking {
  user: User;
  totalSubmissions: number;
  reviewedSubmissions: number;
  averageScore: number;
  highestScore: number;
  lastActive: string;
  rank: number;
  avgCorrectness: number;
  avgStyle: number;
  avgEfficiency: number;
}
