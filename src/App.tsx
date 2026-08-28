import React, { useState } from 'react';
import { 
  Suspect, 
  OfficerProfile, 
  OfflineQueuedScan, 
  AuditLogEntry, 
  CriminalRecord, 
  Warrant, 
  SearchPurposeCode,
  FingerPosition 
} from './types';
import { 
  MOCK_SUSPECTS, 
  INITIAL_OFFICERS, 
  INITIAL_AUDIT_LOGS 
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { BiometricScanner } from './components/BiometricScanner';
import { SuspectDossier } from './components/SuspectDossier';
import { NationalSearch } from './components/NationalSearch';
import { OfflineQueueManager } from './components/OfflineQueueManager';
import { AuditLedger } from './components/AuditLedger';
import { MultiAgencyFederation } from './components/MultiAgencyFederation';
import { NewRecordModal } from './components/NewRecordModal';
import { quickHash, calculateCosineSimilarity } from './utils/crypto';
import { 
  Fingerprint, 
  Shield, 
  HardDrive, 
  FileText, 
  Search, 
  Activity, 
  Lock, 
  AlertTriangle, 
  CheckCircle2,
  BellRing
} from 'lucide-react';

export default function App() {
  const [suspects, setSuspects] = useState<Suspect[]>(MOCK_SUSPECTS);
  const [currentOfficer, setCurrentOfficer] = useState<OfficerProfile>(INITIAL_OFFICERS[0]);
  const [activeTab, setActiveTab] = useState<'scanner' | 'dossier' | 'search' | 'offline' | 'audit' | 'federation'>('scanner');
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(MOCK_SUSPECTS[0]);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueuedScan[]>([
    {
      id: 'OFFLINE-SCAN-0091',
      capturedAt: '2026-02-27T13:40:12Z',
      fingerPosition: 'RIGHT_THUMB',
      qualityScore: 92,
      minutiaeCount: 44,
      vectorEmbedding: MOCK_SUSPECTS[3].biometrics[0].vectorEmbedding, // Ibrahim Gwandu sample
      purposeCode: 'BORDER_PATROL_SCREENING',
      officerBadge: 'NPF-AP-84920',
      deviceId: 'MORPHO-BLE-FIELD-991',
      gpsLocation: 'Birnin Gwari - Kaduna Forest Highway Axis (Lat: 10.6622, Long: 6.5419)',
      state: 'Kaduna',
      encryptedPayload: 'AES256GCM:9f81a02938102938109283019283019283019283',
      payloadChecksum: 'SHA256:d8a9018249018490182049018204901820490182049018204901820490182049',
      syncStatus: 'PENDING',
      matchedSuspectId: 'SUSP-01J66C12',
    }
  ]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [modalSuspect, setModalSuspect] = useState<Suspect | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'alert' } | null>(null);

  const showToast = (text: string, type: 'success' | 'alert' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Cryptographic audit logging engine
  const handleLogAudit = (
    action: AuditLogEntry['action'],
    purposeCode: SearchPurposeCode,
    resourceId: string,
    summary: string,
    status: AuditLogEntry['resultStatus'],
    confidence?: number
  ) => {
    const prevHash = auditLogs[0]?.currentHash || '0000000000000000000000000000000000000000000000000000000000000000';
    const timestamp = new Date().toISOString();
    const payload = `${timestamp}|${currentOfficer.id}|${action}|${purposeCode}|${status}|${resourceId}`;
    const currentHash = quickHash(prevHash + payload);

    const newLog: AuditLogEntry = {
      id: `AUD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp,
      officerId: currentOfficer.id,
      officerName: currentOfficer.fullName,
      officerBadge: currentOfficer.badgeNumber,
      agency: currentOfficer.agency,
      action,
      purposeCode,
      resourceId,
      resourceSummary: summary,
      ipAddress: `${currentOfficer.agency === 'NPF' ? '197.210.65.18' : '105.112.44.89'} (${currentOfficer.station})`,
      deviceId: `DEV-${currentOfficer.agency}-SECURE-01`,
      locationState: currentOfficer.stateCode === 'LA' ? 'Lagos' : 'FCT - Abuja',
      resultStatus: status,
      confidenceScore: confidence,
      previousHash: prevHash,
      currentHash,
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Queue offline biometric/facial scan
  const handleQueueOfflineScan = (scanData: {
    modality?: 'FINGERPRINT' | 'FACIAL';
    fingerPosition?: FingerPosition;
    qualityScore: number;
    minutiaeCount?: number;
    vectorEmbedding: number[];
    purposeCode: SearchPurposeCode;
    gpsLocation: string;
    state: string;
    faceImageBase64?: string;
    landmarksCount?: number;
    cctvEnhanced?: boolean;
  }) => {
    const scanId = `OFFLINE-${scanData.modality === 'FACIAL' ? 'FACE' : 'SCAN'}-${Math.floor(1000 + Math.random() * 9000)}`;
    const checksum = quickHash(scanId + JSON.stringify(scanData.vectorEmbedding.slice(0, 10)));
    
    // Check if matches known suspect
    let matchedId: string | undefined;
    for (const s of suspects) {
      if (scanData.modality === 'FACIAL') {
        if (s.facialTemplate) {
          const sim = calculateCosineSimilarity(scanData.vectorEmbedding, s.facialTemplate.vectorEmbedding);
          if (sim >= 0.82) {
            matchedId = s.id;
            break;
          }
        }
      } else {
        if (s.biometrics.length > 0) {
          const sim = calculateCosineSimilarity(scanData.vectorEmbedding, s.biometrics[0].vectorEmbedding);
          if (sim >= 0.85) {
            matchedId = s.id;
            break;
          }
        }
      }
    }

    const newQueueItem: OfflineQueuedScan = {
      id: scanId,
      capturedAt: new Date().toISOString(),
      modality: scanData.modality || 'FINGERPRINT',
      fingerPosition: scanData.fingerPosition || 'RIGHT_THUMB',
      qualityScore: scanData.qualityScore,
      minutiaeCount: scanData.minutiaeCount || 44,
      landmarksCount: scanData.landmarksCount,
      faceImageBase64: scanData.faceImageBase64,
      cctvEnhanced: scanData.cctvEnhanced,
      vectorEmbedding: scanData.vectorEmbedding,
      purposeCode: scanData.purposeCode,
      officerBadge: currentOfficer.badgeNumber,
      deviceId: scanData.modality === 'FACIAL' ? 'CAM-FIELD-ARREST-01' : 'MORPHO-BLE-FIELD-991',
      gpsLocation: scanData.gpsLocation,
      state: scanData.state,
      encryptedPayload: `AES256GCM:${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
      payloadChecksum: `SHA256:${checksum}`,
      syncStatus: 'PENDING',
      matchedSuspectId: matchedId,
    };

    setOfflineQueue(prev => [newQueueItem, ...prev]);
    showToast(`Scan ${scanId} secured in encrypted offline storage.`, 'alert');
  };

  // Batch sync offline queue
  const handleSyncAll = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 1200));

    setOfflineQueue(prev => prev.map(item => ({
      ...item,
      syncStatus: 'SYNCED',
    })));

    handleLogAudit(
      'SYNC_EXECUTED',
      'IDENTITY_VERIFICATION',
      'OFFLINE_SYNC_BATCH',
      `Synchronized ${offlineQueue.filter(q => q.syncStatus === 'PENDING').length} field biometric scans from offline storage to National Central Registry.`,
      'SYNC_SUCCESS'
    );

    setIsSyncing(false);
    showToast('Offline scan queue synchronized with Central Criminal Registry (CCR).', 'success');
  };

  const handleClearSynced = () => {
    setOfflineQueue(prev => prev.filter(q => q.syncStatus !== 'SYNCED'));
    showToast('Cleared synced offline scans.', 'success');
  };

  // Attach new criminal charge or warrant
  const handleAddRecord = (suspectId: string, record: CriminalRecord, warrant?: Warrant) => {
    setSuspects(prev => prev.map(s => {
      if (s.id === suspectId) {
        return {
          ...s,
          criminalRecords: [record, ...s.criminalRecords],
          activeWarrants: warrant ? [warrant, ...s.activeWarrants] : s.activeWarrants,
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    }));

    if (selectedSuspect && selectedSuspect.id === suspectId) {
      setSelectedSuspect(prev => prev ? {
        ...prev,
        criminalRecords: [record, ...prev.criminalRecords],
        activeWarrants: warrant ? [warrant, ...prev.activeWarrants] : prev.activeWarrants,
      } : null);
    }

    handleLogAudit(
      warrant ? 'WARRANT_ISSUED' : 'RECORD_CREATED',
      'CRIMINAL_INVESTIGATION',
      suspectId,
      `New charge '${record.offenseTitle}' (${record.caseNumber}) attached to suspect. ${warrant ? `National Bench Warrant ${warrant.warrantNumber} broadcasted.` : ''}`,
      'AUTHORIZED_ACCESS'
    );

    showToast(`New charge recorded on file for suspect.`, 'success');
  };

  const pendingOfflineCount = offlineQueue.filter(q => q.syncStatus === 'PENDING').length;
  const totalActiveWarrantsCount = suspects.reduce((acc, s) => acc + s.activeWarrants.length, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Federal Navigation Header */}
      <Navbar
        currentOfficer={currentOfficer}
        onSelectOfficer={setCurrentOfficer}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOffline={isOffline}
        onToggleOffline={() => {
          setIsOffline(!isOffline);
          showToast(`Switched network state to: ${!isOffline ? 'FIELD OFFLINE MODE' : 'CENTRAL ONLINE'}`, !isOffline ? 'alert' : 'success');
        }}
        pendingOfflineCount={pendingOfflineCount}
        onTriggerSync={() => {
          setActiveTab('offline');
          handleSyncAll();
        }}
        activeSuspectName={selectedSuspect ? `${selectedSuspect.firstName} ${selectedSuspect.lastName}` : undefined}
        hasActiveWarrantsCount={totalActiveWarrantsCount}
      />

      {/* Floating System Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in-50 slide-in-from-bottom-5">
          <div className={`p-3.5 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 border-emerald-600 text-emerald-200 shadow-emerald-950/50'
              : 'bg-amber-950 border-amber-600 text-amber-200 shadow-amber-950/50'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <BellRing className="w-4 h-4 text-amber-400 flex-shrink-0 animate-bounce" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main App Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'scanner' && (
          <BiometricScanner
            suspects={suspects}
            currentOfficer={currentOfficer}
            isOffline={isOffline}
            onMatchFound={(suspect, confidence) => {
              setSelectedSuspect(suspect);
              showToast(`Biometric Match Verified: ${suspect.firstName} ${suspect.lastName} (${(confidence * 100).toFixed(1)}%)`, 'success');
            }}
            onQueueOfflineScan={handleQueueOfflineScan}
            onLogAudit={handleLogAudit}
            onNavigateToDossier={(suspect) => {
              setSelectedSuspect(suspect);
              setActiveTab('dossier');
              handleLogAudit(
                'DOSSIER_VIEW',
                'CRIMINAL_INVESTIGATION',
                suspect.id,
                `Officer ${currentOfficer.fullName} inspected full legal dossier for ${suspect.firstName} ${suspect.lastName}`,
                'AUTHORIZED_ACCESS'
              );
            }}
          />
        )}

        {activeTab === 'dossier' && (
          <SuspectDossier
            suspect={selectedSuspect}
            currentOfficer={currentOfficer}
            onOpenNewRecordModal={(s) => setModalSuspect(s)}
            onLogAudit={handleLogAudit}
          />
        )}

        {activeTab === 'search' && (
          <NationalSearch
            suspects={suspects}
            currentOfficer={currentOfficer}
            onSelectSuspect={(s) => {
              setSelectedSuspect(s);
              setActiveTab('dossier');
              handleLogAudit(
                'DOSSIER_VIEW',
                'CRIMINAL_INVESTIGATION',
                s.id,
                `Selected record for suspect ${s.firstName} ${s.lastName} (${s.systemRef}) from National Repository search`,
                'AUTHORIZED_ACCESS'
              );
            }}
          />
        )}

        {activeTab === 'offline' && (
          <OfflineQueueManager
            queue={offlineQueue}
            suspects={suspects}
            isOffline={isOffline}
            onToggleOffline={() => setIsOffline(!isOffline)}
            onSyncAll={handleSyncAll}
            onClearSynced={handleClearSynced}
            onViewSuspect={(s) => {
              setSelectedSuspect(s);
              setActiveTab('dossier');
            }}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLedger
            logs={auditLogs}
            currentOfficer={currentOfficer}
          />
        )}

        {activeTab === 'federation' && (
          <MultiAgencyFederation />
        )}
      </main>

      {/* Modal for adding new case charge / issuing warrant */}
      <NewRecordModal
        suspect={modalSuspect}
        isOpen={!!modalSuspect}
        onClose={() => setModalSuspect(null)}
        onAddRecord={handleAddRecord}
        currentOfficer={currentOfficer}
      />

      {/* Federal Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 text-slate-500 text-[11px] py-4 px-4 sm:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>N-CRIMS • Central Criminal Identification & Matching Repository • Federal Republic of Nigeria</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>NDPA Act 2023 Sec. 24 Compliant</span>
            <span>•</span>
            <span>Zero-Trust Architecture</span>
            <span>•</span>
            <span className="font-mono text-emerald-400">SEC-ID: NPF-CCR-NG-01</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
