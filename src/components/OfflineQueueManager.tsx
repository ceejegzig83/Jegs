import React, { useState } from 'react';
import { 
  HardDrive, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Lock, 
  MapPin, 
  Fingerprint,
  Camera,
  Trash2,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { OfflineQueuedScan, OfficerProfile, Suspect } from '../types';
import { calculateCosineSimilarity } from '../utils/crypto';

interface OfflineQueueManagerProps {
  queue: OfflineQueuedScan[];
  suspects: Suspect[];
  isOffline: boolean;
  onToggleOffline: () => void;
  onSyncAll: () => Promise<void>;
  onClearSynced: () => void;
  onViewSuspect: (suspect: Suspect) => void;
  isSyncing: boolean;
}

export const OfflineQueueManager: React.FC<OfflineQueueManagerProps> = ({
  queue,
  suspects,
  isOffline,
  onToggleOffline,
  onSyncAll,
  onClearSynced,
  onViewSuspect,
  isSyncing
}) => {
  const [selectedScan, setSelectedScan] = useState<OfflineQueuedScan | null>(null);

  const pendingCount = queue.filter(q => q.syncStatus === 'PENDING').length;
  const syncedCount = queue.filter(q => q.syncStatus === 'SYNCED').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Offline Biometric Store & Sync Engine
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  AES-256-GCM Encrypted
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Buffers biometric minutiae captures in remote, zero-reception border checkpoints & transit corridors.
              </p>
            </div>
          </div>

          {/* Offline Mode Switcher & Sync Button */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={onToggleOffline}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors flex items-center justify-center gap-2 ${
                isOffline 
                  ? 'bg-amber-950 border-amber-600 text-amber-300' 
                  : 'bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {isOffline ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
              <span>{isOffline ? 'Simulate Online Network' : 'Simulate Remote Offline Zone'}</span>
            </button>

            <button
              id="batch-sync-now-btn"
              onClick={onSyncAll}
              disabled={isSyncing || pendingCount === 0 || isOffline}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                isSyncing || pendingCount === 0 || isOffline
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-950/50 active:scale-[0.99]'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing Scans...' : `Sync Queue (${pendingCount} Pending)`}</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Pending Sync:</span>
            <span className="font-bold text-amber-400 font-mono text-sm">{pendingCount} Scans</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Successfully Synced:</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">{syncedCount} Scans</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Hardware Keystore:</span>
            <span className="font-bold text-slate-200 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hardware-Backed</span>
            </span>
          </div>
        </div>
      </div>

      {/* Queued Scans List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Queued Device Scans ({queue.length} Total Buffered Records)</span>
          {syncedCount > 0 && (
            <button
              onClick={onClearSynced}
              className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Synced Records</span>
            </button>
          )}
        </div>

        {queue.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Offline Queue is Empty</p>
            <p className="text-xs text-slate-500">
              When in offline mode, any scans captured in the Biometric Scanner will be stored here with AES-256 encryption.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {queue.map((scan) => {
              const matchedSuspect = scan.matchedSuspectId ? suspects.find(s => s.id === scan.matchedSuspectId) : null;
              return (
                <div
                  key={scan.id}
                  className={`bg-slate-900 border rounded-xl p-4 transition-all duration-200 shadow-md ${
                    scan.syncStatus === 'SYNCED'
                      ? 'border-emerald-800/40 bg-slate-900/60'
                      : 'border-amber-700/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold ${
                        scan.syncStatus === 'SYNCED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                          : 'bg-amber-950 text-amber-400 border border-amber-700'
                      }`}>
                        {scan.modality === 'FACIAL' ? (
                          <Camera className="w-5 h-5" />
                        ) : (
                          <Fingerprint className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{scan.id}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {scan.modality === 'FACIAL'
                              ? `FACIAL PROBE ${scan.cctvEnhanced ? '(CCTV ENHANCED)' : '(DEEP ARCFACE)'}`
                              : (scan.fingerPosition?.replace('_', ' ') || 'BIOMETRIC SCAN')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Quality: {scan.qualityScore}%</span>
                          <span>•</span>
                          <span>
                            {scan.modality === 'FACIAL'
                              ? `${scan.landmarksCount || 68} Facial Landmarks`
                              : `Minutiae: ${scan.minutiaeCount || 46} pts`}
                          </span>
                          <span>•</span>
                          <span>Purpose: {scan.purposeCode}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-left sm:text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${
                          scan.syncStatus === 'SYNCED'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : 'bg-amber-950 text-amber-300 border-amber-700 animate-pulse'
                        }`}>
                          {scan.syncStatus === 'SYNCED' ? 'SYNCED TO CCR' : 'PENDING NETWORK'}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {new Date(scan.capturedAt).toLocaleTimeString()}
                        </div>
                      </div>

                      {matchedSuspect && (
                        <button
                          onClick={() => onViewSuspect(matchedSuspect)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow"
                        >
                          <span>View Match</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Geolocation & Encrypted Token Breakdown */}
                  <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="truncate">GPS: {scan.gpsLocation}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <Lock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span className="truncate">SHA256 CHECKSUM: {scan.payloadChecksum}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
