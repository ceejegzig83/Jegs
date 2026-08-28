import React, { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  Scan, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  HardDrive, 
  Sliders, 
  Radio, 
  RotateCcw,
  Sparkles,
  Lock,
  Cpu,
  Layers,
  MapPin,
  FileCheck2
} from 'lucide-react';
import { 
  Suspect, 
  OfficerProfile, 
  SearchPurposeCode, 
  BiometricMatchResult, 
  FingerPosition 
} from '../types';
import { 
  calculateCosineSimilarity, 
  generateBiometricVector, 
  generateMinutiaePoints, 
  quickHash 
} from '../utils/crypto';

interface BiometricScannerProps {
  suspects: Suspect[];
  currentOfficer: OfficerProfile;
  isOffline: boolean;
  onMatchFound: (suspect: Suspect, confidence: number) => void;
  onQueueOfflineScan: (scanData: {
    fingerPosition: FingerPosition;
    qualityScore: number;
    minutiaeCount: number;
    vectorEmbedding: number[];
    purposeCode: SearchPurposeCode;
    gpsLocation: string;
    state: string;
  }) => void;
  onLogAudit: (
    action: 'BIOMETRIC_SEARCH' | 'DOSSIER_VIEW' | 'OFFLINE_SCAN_QUEUED',
    purposeCode: SearchPurposeCode,
    resourceId: string,
    summary: string,
    status: 'MATCH_FOUND' | 'NO_MATCH' | 'AUTHORIZED_ACCESS',
    confidence?: number
  ) => void;
  onNavigateToDossier: (suspect: Suspect) => void;
}

export const BiometricScanner: React.FC<BiometricScannerProps> = ({
  suspects,
  currentOfficer,
  isOffline,
  onMatchFound,
  onQueueOfflineScan,
  onLogAudit,
  onNavigateToDossier
}) => {
  // Scanner state
  const [selectedPreset, setSelectedPreset] = useState<string>('SUSP-01J98K21');
  const [selectedFinger, setSelectedFinger] = useState<FingerPosition>('RIGHT_THUMB');
  const [selectedDevice, setSelectedDevice] = useState<string>('Suprema RealScan-G10 (Station & Mobile)');
  const [purposeCode, setPurposeCode] = useState<SearchPurposeCode>('CHECKPOINT_INTERCEPTION');
  const [gpsLocation, setGpsLocation] = useState<string>('Mile 2 Expressway Checkpoint, Lagos State (Lat: 6.4698, Long: 3.2833)');
  
  // Scanning sequence state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStepLabel, setScanStepLabel] = useState<string>('Scanner Idle');
  const [activeMinutiaeCount, setActiveMinutiaeCount] = useState<number>(0);
  const [scanQualityScore, setScanQualityScore] = useState<number>(94);
  const [matchResult, setMatchResult] = useState<BiometricMatchResult | null>(null);
  const [laserPosition, setLaserPosition] = useState<number>(0);
  const [isHoveringSensor, setIsHoveringSensor] = useState<boolean>(false);

  // Scan simulation timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isScanning) {
      const interval = setInterval(() => {
        setLaserPosition((prev) => (prev >= 100 ? 0 : prev + 4));
      }, 50);

      const runScanSteps = async () => {
        setScanStepLabel('Acquiring optical capacitive ridge pattern...');
        setScanProgress(20);
        await new Promise(r => setTimeout(r, 600));

        setScanStepLabel('Extracting ISO/IEC 19794-2 Minutiae (Bifurcations & Endings)...');
        setScanProgress(50);
        setActiveMinutiaeCount(Math.floor(40 + Math.random() * 12));
        await new Promise(r => setTimeout(r, 700));

        setScanStepLabel('Synthesizing 128-dimensional biometric vector embedding...');
        setScanProgress(75);
        await new Promise(r => setTimeout(r, 600));

        if (isOffline) {
          setScanStepLabel('Offline Mode Active: Encrypting payload with AES-256-GCM & local caching...');
          setScanProgress(100);
          await new Promise(r => setTimeout(r, 500));

          // Generate vector and queue offline
          let vector: number[];
          if (selectedPreset === 'UNKNOWN') {
            vector = generateBiometricVector('unknown_suspect_offline_' + Date.now());
          } else {
            const matchedTarget = suspects.find(s => s.id === selectedPreset);
            vector = matchedTarget?.biometrics[0]?.vectorEmbedding || generateBiometricVector('seed_' + Date.now());
          }

          onQueueOfflineScan({
            fingerPosition: selectedFinger,
            qualityScore: scanQualityScore,
            minutiaeCount: 44,
            vectorEmbedding: vector,
            purposeCode,
            gpsLocation,
            state: currentOfficer.stateCode === 'LA' ? 'Lagos' : 'FCT - Abuja',
          });

          onLogAudit(
            'OFFLINE_SCAN_QUEUED',
            purposeCode,
            'OFFLINE_QUEUE_BATCH',
            `Biometric scan captured offline at ${gpsLocation} by ${currentOfficer.fullName} (${currentOfficer.badgeNumber}). AES-256 encrypted in local device secure storage.`,
            'AUTHORIZED_ACCESS'
          );

          setMatchResult({
            searchId: 'SCAN-OFFLINE-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            timestamp: new Date().toISOString(),
            matched: false,
            confidence: 0,
            matchMinutiaeCount: 44,
            vectorDistance: 0,
            isOfflineResolved: true,
          });

          setIsScanning(false);
          setScanProgress(0);
          return;
        }

        setScanStepLabel('Querying Centralized National Vector Database (pgvector / FAISS)...');
        setScanProgress(90);
        await new Promise(r => setTimeout(r, 600));

        // Evaluate match against database
        let candidateVector: number[];
        let matchedSuspect: Suspect | undefined;
        let highestSimilarity = 0;

        if (selectedPreset === 'UNKNOWN') {
          candidateVector = generateBiometricVector('unregistered_person_' + Date.now());
          // Compare against all suspects
          for (const s of suspects) {
            for (const bio of s.biometrics) {
              const sim = calculateCosineSimilarity(candidateVector, bio.vectorEmbedding);
              if (sim > highestSimilarity) highestSimilarity = sim;
            }
          }
          // Unregistered confidence is low
          highestSimilarity = Math.min(0.42, highestSimilarity);
        } else {
          matchedSuspect = suspects.find(s => s.id === selectedPreset);
          if (matchedSuspect && matchedSuspect.biometrics.length > 0) {
            candidateVector = matchedSuspect.biometrics[0].vectorEmbedding;
            highestSimilarity = 0.984 + (Math.random() * 0.012 - 0.006);
          } else {
            candidateVector = generateBiometricVector('fallback_' + Date.now());
            highestSimilarity = 0.95;
          }
        }

        const isMatch = highestSimilarity >= 0.85 && !!matchedSuspect;

        const res: BiometricMatchResult = {
          searchId: 'NCRIMS-SRCH-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          timestamp: new Date().toISOString(),
          matched: isMatch,
          confidence: Number(highestSimilarity.toFixed(4)),
          suspect: isMatch ? matchedSuspect : undefined,
          matchMinutiaeCount: isMatch ? 42 : 12,
          vectorDistance: Number((1 - highestSimilarity).toFixed(4)),
          isOfflineResolved: false,
        };

        setMatchResult(res);
        setScanProgress(100);
        setScanStepLabel('Matching Complete');

        if (isMatch && matchedSuspect) {
          onMatchFound(matchedSuspect, res.confidence);
          onLogAudit(
            'BIOMETRIC_SEARCH',
            purposeCode,
            matchedSuspect.id,
            `Live Biometric Search matched candidate ${matchedSuspect.firstName} ${matchedSuspect.lastName} (${matchedSuspect.systemRef}) with ${(res.confidence * 100).toFixed(1)}% confidence. Purpose: ${purposeCode}`,
            'MATCH_FOUND',
            res.confidence
          );
        } else {
          onLogAudit(
            'BIOMETRIC_SEARCH',
            purposeCode,
            'NO_RECORD_FOUND',
            `Biometric search performed with no candidate match found above 0.85 threshold. Purpose: ${purposeCode}`,
            'NO_MATCH',
            res.confidence
          );
        }

        setIsScanning(false);
      };

      runScanSteps();
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  const handleStartScan = () => {
    setMatchResult(null);
    setScanProgress(0);
    setIsScanning(true);
  };

  const getActivePresetSuspect = () => {
    return suspects.find(s => s.id === selectedPreset);
  };

  const activeSuspect = getActivePresetSuspect();
  const minutiaePoints = activeSuspect?.biometrics[0]?.minutiaePoints || generateMinutiaePoints(selectedPreset, 40);

  return (
    <div className="space-y-6">
      {/* Top Banner / Tactical Guidance */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Fingerprint className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Biometric Vector Matching Engine
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                ISO/IEC 19794-2
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Live optical/capacitive minutiae extraction with vector similarity queries across the Federal Criminal Repository.
            </p>
          </div>
        </div>

        {/* Offline Status Badge */}
        <div className="flex items-center gap-2">
          {isOffline ? (
            <div className="px-3 py-1.5 rounded-lg bg-amber-950/70 border border-amber-600/60 text-amber-300 text-xs font-semibold flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span>Offline Scan Cache Active (AES-256)</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Central Vector Repository Connected</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Scanner Hardware Interface & Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Biometric Scanner Device */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
            {/* Device Hardware Bezel Frame */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs text-slate-400">
              <div className="flex items-center gap-2 font-mono">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-200 font-semibold">{selectedDevice}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>SENSOR READY (500 DPI)</span>
              </div>
            </div>

            {/* Interactive Scanner Pad Glass Area */}
            <div 
              id="fingerprint-sensor-pad"
              onMouseEnter={() => setIsHoveringSensor(true)}
              onMouseLeave={() => setIsHoveringSensor(false)}
              onClick={!isScanning ? handleStartScan : undefined}
              className={`relative mx-auto w-64 h-72 sm:w-72 sm:h-80 rounded-2xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-2 transition-all cursor-pointer flex flex-col items-center justify-center p-4 overflow-hidden select-none group ${
                isScanning
                  ? 'border-emerald-500 shadow-2xl shadow-emerald-500/20'
                  : 'border-slate-700 hover:border-emerald-500/70 hover:shadow-lg hover:shadow-emerald-950/40'
              }`}
            >
              {/* Background Glass Grid & Circular Guides */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="absolute w-44 h-56 rounded-full border border-dashed border-emerald-500/30 pointer-events-none"></div>
              <div className="absolute w-28 h-36 rounded-full border border-emerald-500/20 pointer-events-none"></div>

              {/* Fingerprint Vector Graphic & Ridge Structure */}
              <div className="relative w-40 h-52 flex items-center justify-center">
                <svg
                  viewBox="0 0 200 240"
                  className={`w-full h-full transition-opacity duration-300 ${
                    isScanning ? 'opacity-90' : 'opacity-60 group-hover:opacity-85'
                  }`}
                >
                  <defs>
                    <linearGradient id="ridgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#065f46" />
                    </linearGradient>
                  </defs>

                  {/* Fingerprint Ridge Contours */}
                  <path
                    d="M100,30 C60,30 40,70 40,110 C40,160 60,200 100,210 C140,200 160,160 160,110 C160,70 140,30 100,30 Z"
                    fill="none"
                    stroke="url(#ridgeGradient)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M100,50 C70,50 55,80 55,115 C55,155 70,185 100,195 C130,185 145,155 145,115 C145,80 130,50 100,50 Z"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                  <path
                    d="M100,70 C80,70 70,90 70,120 C70,145 80,170 100,180 C120,170 130,145 130,120 C130,90 120,70 100,70 Z"
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                  <path
                    d="M100,90 C88,90 82,102 82,122 C82,138 88,155 100,162 C112,155 118,138 118,122 C118,102 112,90 100,90 Z"
                    fill="none"
                    stroke="#6ee7b7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M100,105 C94,105 92,112 92,125 C92,134 95,142 100,147 C105,142 108,134 108,125 C108,112 106,105 100,105 Z"
                    fill="none"
                    stroke="#a7f3d0"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Render Minutiae Extraction Points */}
                  {(isScanning || matchResult) &&
                    minutiaePoints.map((pt, idx) => (
                      <g key={idx}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={pt.type === 'CORE' ? 5 : pt.type === 'DELTA' ? 4 : 3}
                          className={
                            pt.type === 'CORE'
                              ? 'fill-amber-400 stroke-amber-200 stroke-1 animate-pulse'
                              : pt.type === 'DELTA'
                              ? 'fill-blue-400 stroke-blue-200 stroke-1'
                              : pt.type === 'BIFURCATION'
                              ? 'fill-red-500 stroke-red-300 stroke-1'
                              : 'fill-emerald-400 stroke-emerald-200 stroke-1'
                          }
                        />
                        {/* Angle indicator needle */}
                        <line
                          x1={pt.x}
                          y1={pt.y}
                          x2={pt.x + Math.cos((pt.angle * Math.PI) / 180) * 8}
                          y2={pt.y + Math.sin((pt.angle * Math.PI) / 180) * 8}
                          stroke="#ffffff"
                          strokeWidth="1"
                          opacity="0.75"
                        />
                      </g>
                    ))}
                </svg>

                {/* Laser Sweep Scan Effect */}
                {isScanning && (
                  <div
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] pointer-events-none transition-all duration-75"
                    style={{ top: `${laserPosition}%` }}
                  ></div>
                )}
              </div>

              {/* Pad Prompt & Telemetry Overlay */}
              <div className="mt-3 text-center z-10">
                {isScanning ? (
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 font-mono animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{scanStepLabel}</span>
                    </div>
                    <div className="w-48 h-1.5 bg-slate-800 rounded-full mx-auto overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-xs font-semibold text-slate-200 block">
                      {isHoveringSensor ? 'CLICK TO TRIGGER OPTICAL CAPTURE' : 'PLACE FINGER ON OPTICAL SENSOR'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Position: {selectedFinger.replace('_', ' ')} • Quality: {scanQualityScore}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Minutiae Legend & Quality Meter */}
            <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Ridge Ending</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                <span>Bifurcation</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Core Point</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                <span>Delta Tri-Radius</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="mt-5 flex gap-3">
              <button
                id="start-biometric-scan-btn"
                onClick={handleStartScan}
                disabled={isScanning}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isScanning
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-950/50 active:scale-[0.99]'
                }`}
              >
                {isScanning ? (
                  <>
                    <Scan className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>EXTRACTING BIOMETRIC VECTOR ({scanProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5" />
                    <span>TRIGGER BIOMETRIC SCAN & REPOSITORY QUERY</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setMatchResult(null);
                  setScanProgress(0);
                }}
                title="Reset Scanner"
                className="px-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Parameters, NDPA Purpose, Preset Subjects & Live Match Outcome */}
        <div className="lg:col-span-5 space-y-4">
          {/* Preset Test Fingerprints Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Preset Suspect / Field Sample:</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Test Simulator</span>
            </div>

            <div className="space-y-1.5">
              {suspects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedPreset(s.id);
                    setMatchResult(null);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors border ${
                    selectedPreset === s.id
                      ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={s.mugshotUrl}
                      alt={s.lastName}
                      className="w-7 h-7 rounded-md object-cover border border-slate-700"
                    />
                    <div className="truncate">
                      <div className="font-semibold text-slate-100 truncate">
                        {s.firstName} {s.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {s.aliases[0] || 'No alias'} • {s.stateOfOrigin} State
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-2">
                    {s.activeWarrants.length > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-950 text-red-300 border border-red-800">
                        WARRANT
                      </span>
                    )}
                  </div>
                </button>
              ))}

              {/* Unregistered suspect option */}
              <button
                onClick={() => {
                  setSelectedPreset('UNKNOWN');
                  setMatchResult(null);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors border ${
                  selectedPreset === 'UNKNOWN'
                    ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200'
                    : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                    ?
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100">Unidentified / Clean Citizen (No Match)</div>
                    <div className="text-[10px] text-slate-400">Simulates suspect with zero criminal record in repository</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* NDPA Statutory Search Purpose & Field Officer Geolocation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>NDPA 2023 Statutory Purpose Code:</span>
              </label>
              <span className="text-[10px] text-indigo-400 font-mono">Mandatory Audit</span>
            </div>

            <select
              value={purposeCode}
              onChange={(e) => setPurposeCode(e.target.value as SearchPurposeCode)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="CHECKPOINT_INTERCEPTION">CHECKPOINT_INTERCEPTION (Highway / Patrol Stop)</option>
              <option value="IDENTITY_VERIFICATION">IDENTITY_VERIFICATION (Station / Custodial Intake)</option>
              <option value="ACTIVE_WARRANT_CHECK">ACTIVE_WARRANT_CHECK (Fugitive Apprehension)</option>
              <option value="CRIMINAL_INVESTIGATION">CRIMINAL_INVESTIGATION (Active Case Forensic Link)</option>
              <option value="BORDER_PATROL_SCREENING">BORDER_PATROL_SCREENING (Immigration / Border Exit)</option>
              <option value="COURT_ORDERED_INQUIRY">COURT_ORDERED_INQUIRY (Judicial Subpoena)</option>
            </select>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Finger Position:</label>
                <select
                  value={selectedFinger}
                  onChange={(e) => setSelectedFinger(e.target.value as FingerPosition)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
                >
                  <option value="RIGHT_THUMB">Right Thumb</option>
                  <option value="RIGHT_INDEX">Right Index</option>
                  <option value="RIGHT_MIDDLE">Right Middle</option>
                  <option value="LEFT_THUMB">Left Thumb</option>
                  <option value="LEFT_INDEX">Left Index</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Scanner Profile:</label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200"
                >
                  <option value="Suprema RealScan-G10">Suprema RealScan-G10</option>
                  <option value="MorphoTop 100 LiveScan">MorphoTop 100 LiveScan</option>
                  <option value="Bluetooth BLE Handheld Wand">Bluetooth BLE Handheld Wand</option>
                  <option value="Crossmatch Verifier 300">Crossmatch Verifier 300</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>Location: {gpsLocation}</span>
            </div>
          </div>

          {/* Live Search Match Result Output Card */}
          {matchResult && (
            <div className="rounded-xl border shadow-xl p-4 transition-all duration-300 animate-in fade-in-50 bg-slate-900 border-slate-700">
              {matchResult.isOfflineResolved ? (
                // Offline Result Card
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <HardDrive className="w-5 h-5" />
                    <span>Scan Cached in Encrypted Offline Store</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Device is operating in Field Offline Mode. Biometric minutiae extracted (44 points) and AES-256 payload stored with non-repudiation signature. It will auto-match upon network synchronization.
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400">
                    <div>TOKEN: {matchResult.searchId}</div>
                    <div>CHECKSUM: {quickHash(matchResult.searchId).substring(0, 24)}...</div>
                  </div>
                </div>
              ) : matchResult.matched && matchResult.suspect ? (
                // Positive Match Card
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>POSITIVE BIOMETRIC MATCH FOUND</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 text-xs font-mono font-bold">
                      {(matchResult.confidence * 100).toFixed(1)}% Match
                    </span>
                  </div>

                  {/* Active Warrant Alert Banner if exists */}
                  {matchResult.suspect.activeWarrants.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-950/90 border border-red-700 text-red-200 text-xs flex items-start gap-2 shadow-inner">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <div className="font-bold text-red-100 uppercase tracking-wider">
                          CRITICAL ACTIVE BENCH WARRANT
                        </div>
                        <div className="text-red-300 text-[11px] mt-0.5">
                          {matchResult.suspect.activeWarrants[0].warrantNumber} • {matchResult.suspect.activeWarrants[0].issuingCourt}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suspect Quick Preview */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <img
                      src={matchResult.suspect.mugshotUrl}
                      alt={matchResult.suspect.lastName}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm">
                        {matchResult.suspect.firstName} {matchResult.suspect.lastName}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Ref: {matchResult.suspect.systemRef} • {matchResult.suspect.stateOfOrigin} State
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        {matchResult.suspect.criminalRecords.length} Criminal Case Records on File
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Legal Safe-Harbor Notice */}
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 leading-normal flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-200">NDPA Due Process Mandate:</strong> A biometric match is an identity signal, not a summary determination of guilt. Officer must verify legal warrant and identity documents.
                    </span>
                  </div>

                  {/* Open Dossier Button */}
                  <button
                    id="view-matched-dossier-btn"
                    onClick={() => onNavigateToDossier(matchResult.suspect!)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                  >
                    <span>OPEN FULL SUSPECT DOSSIER & COURT DISPOSITIONS</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                // No Match Found Card
                <div className="space-y-2 text-center py-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-slate-200 text-sm">No Matching Criminal Record Found</div>
                  <p className="text-xs text-slate-400">
                    Biometric vector distance is below national threshold (&lt;0.85). Subject has no recorded criminal history or outstanding bench warrants across all 36 States & FCT.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
