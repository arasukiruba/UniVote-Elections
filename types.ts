export enum Role {
  MASTER = 'MASTER',
  ADMIN = 'ADMIN',
  VOTER = 'VOTER'
}

export enum ElectionStatus {
  NOT_STARTED = 'NOT_STARTED',
  CAMPAIGN = 'CAMPAIGN',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  ANNOUNCED = 'ANNOUNCED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  password?: string;
}

export interface Election {
  id: string;
  title: string;
  pollingDate: string;
  status: ElectionStatus;
  createdAt: string;
  createdBy: string; // ID of the admin who created it
}

export interface Position {
  id: string;
  electionId: string;
  title: string;
  orderIndex: number;
}

export interface CandidateFile {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface Candidate {
  id: string;
  electionId: string;
  positionId: string;
  fullName: string;
  slogan: string;
  imageUrl: string;
  description: string;
  files?: CandidateFile[];
  voteCount?: number; // Only for admin/results
}

export interface WhitelistEntry {
  id: string;
  electionId: string;
  email: string;
  isRegistered: boolean;
  passwordPlain?: string; // Requirement: Admin needs to see this
  hasVoted: boolean;
}

export interface Vote {
  electionId: string;
  positionId: string;
  candidateId: string;
  voterEmail: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
}