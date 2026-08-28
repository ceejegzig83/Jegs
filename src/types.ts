export type UserRole = 
  | 'FIELD_OFFICER' 
  | 'STATION_DESK_OFFICER' 
  | 'LEAD_INVESTIGATOR' 
  | 'NDPA_AUDITOR' 
  | 'SYSTEM_ADMIN';

export type AgencyCode = 'NPF' | 'EFCC' | 'DSS' | 'NCOS' | 'NDLEA' | 'ICPC';

export interface OfficerProfile {
  id: string;
  badgeNumber: string;
  fullName: string;
  rank: string;
  agency: AgencyCode;
  agencyName: string;
  station: string;
  stateCode: string;
  role: UserRole;
  mfaVerified: boolean;
  avatarUrl: string;
}

export type FingerPosition = 
  | 'RIGHT_THUMB' 
  | 'RIGHT_INDEX' 
  | 'RIGHT_MIDDLE' 
  | 'LEFT_THUMB' 
  | 'LEFT_INDEX';

export interface MinutiaePoint {
  x: number;
  y: number;
  type: 'BIFURCATION' | 'RIDGE_ENDING' | 'CORE' | 'DELTA';
  angle: number;
  quality: number;
}

export interface BiometricTemplate {
  templateId: string;
  fingerPosition: FingerPosition;
  qualityScore: number; // 0 - 100
  minutiaeCount: number;
  minutiaePoints: MinutiaePoint[];
  vectorEmbedding: number[]; // 128-dim normalized biometric vector
  isoStandard: 'ISO/IEC 19794-2' | 'ANSI/NIST-ITL 1-2011';
  encryptedHash: string;
  captureDevice: string;
  capturedAt: string;
}

export type WarrantSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export interface Warrant {
  id: string;
  warrantNumber: string;
  issuingCourt: string;
  issuingJudge: string;
  issuingState: string;
  dateIssued: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXECUTED' | 'QUASHED' | 'EXPIRED';
  severity: WarrantSeverity;
  offense: string;
  bailConditions?: string;
  specialInstructions?: string;
}

export interface CriminalRecord {
  id: string;
  caseNumber: string;
  offenseCategory: 'Violent Crime' | 'Financial & Cybercrime' | 'National Security' | 'Narcotics' | 'Arms & Smuggling' | 'Public Order';
  offenseTitle: string;
  offenseDetails: string;
  arrestDate: string;
  incidentLocation: string;
  arrestingAgency: AgencyCode;
  arrestingStation: string;
  state: string;
  courtName: string;
  courtDisposition: 'Convicted & Sentenced' | 'Remanded in Custody' | 'Awaiting Trial' | 'Acquitted' | 'Bail Granted' | 'Under Investigation';
  dispositionDate: string;
  sentenceSummary?: string;
  custodyLocation?: string; // NCoS Facility
}

export interface Suspect {
  id: string;
  systemRef: string; // e.g., NCRIMS-NG-2026-88419
  ninHash: string; // NDPA anonymized hash
  bvnHash: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  aliases: string[];
  dateOfBirth: string;
  age: number;
  gender: 'Male' | 'Female';
  nationality: string;
  stateOfOrigin: string;
  lga: string;
  bloodGroup: string;
  heightCm: number;
  distinguishingMarks: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  mugshotUrl: string;
  biometrics: BiometricTemplate[];
  criminalRecords: CriminalRecord[];
  activeWarrants: Warrant[];
  lastKnownLocation: {
    state: string;
    city: string;
    coordinates?: [number, number];
    timestamp: string;
  };
  interAgencyFlags: {
    npfAlert: boolean;
    efccWatchlist: boolean;
    dssPriority: boolean;
    ncosEscaped: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export type SearchPurposeCode = 
  | 'IDENTITY_VERIFICATION'
  | 'CHECKPOINT_INTERCEPTION'
  | 'ACTIVE_WARRANT_CHECK'
  | 'CRIMINAL_INVESTIGATION'
  | 'BORDER_PATROL_SCREENING'
  | 'COURT_ORDERED_INQUIRY'
  | 'PRISON_ADMISSION_VERIFICATION';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  officerId: string;
  officerName: string;
  officerBadge: string;
  agency: AgencyCode;
  action: 'BIOMETRIC_SEARCH' | 'DOSSIER_VIEW' | 'OFFLINE_SCAN_QUEUED' | 'SYNC_EXECUTED' | 'WARRANT_ISSUED' | 'RECORD_CREATED' | 'NDPA_EXPORT';
  purposeCode: SearchPurposeCode;
  resourceId?: string;
  resourceSummary?: string;
  ipAddress: string;
  deviceId: string;
  locationState: string;
  resultStatus: 'MATCH_FOUND' | 'NO_MATCH' | 'AUTHORIZED_ACCESS' | 'SYNC_SUCCESS';
  confidenceScore?: number;
  previousHash: string;
  currentHash: string; // Cryptographic chain hash
}

export interface OfflineQueuedScan {
  id: string;
  capturedAt: string;
  fingerPosition: FingerPosition;
  qualityScore: number;
  minutiaeCount: number;
  vectorEmbedding: number[];
  purposeCode: SearchPurposeCode;
  officerBadge: string;
  deviceId: string;
  gpsLocation: string;
  state: string;
  encryptedPayload: string;
  payloadChecksum: string;
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  matchedSuspectId?: string;
}

export interface AgencyFederationStatus {
  agency: AgencyCode;
  name: string;
  systemName: string;
  status: 'ONLINE' | 'DEGRADED' | 'MAINTENANCE';
  latencyMs: number;
  indexedRecordsCount: number;
  lastSyncTime: string;
  encryptionMode: string;
}

export interface BiometricMatchResult {
  searchId: string;
  timestamp: string;
  matched: boolean;
  confidence: number; // 0.00 - 1.00
  suspect?: Suspect;
  matchMinutiaeCount: number;
  vectorDistance: number;
  isOfflineResolved?: boolean;
}
