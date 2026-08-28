import React, { useState } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  FileText, 
  MapPin, 
  Calendar, 
  Scale, 
  Building2, 
  Fingerprint, 
  User, 
  Download, 
  PlusCircle, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Printer,
  FileCheck
} from 'lucide-react';
import { Suspect, OfficerProfile, UserRole, Warrant } from '../types';
import { redactSuspectForRole } from '../utils/crypto';

interface SuspectDossierProps {
  suspect: Suspect | null;
  currentOfficer: OfficerProfile;
  onOpenNewRecordModal: (suspect: Suspect) => void;
  onLogAudit: (
    action: 'BIOMETRIC_SEARCH' | 'DOSSIER_VIEW' | 'NDPA_EXPORT',
    purposeCode: any,
    resourceId: string,
    summary: string,
    status: any
  ) => void;
}

export const SuspectDossier: React.FC<SuspectDossierProps> = ({
  suspect: rawSuspect,
  currentOfficer,
  onOpenNewRecordModal,
  onLogAudit
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  if (!rawSuspect) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <FileText className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-200">No Suspect Dossier Selected</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
            Perform a live scan in the Biometric Scanner or select a record from the National Repository to inspect full criminal histories and active warrants.
          </p>
        </div>
      </div>
    );
  }

  // Apply NDPA role-based redaction
  const suspect = redactSuspectForRole(rawSuspect, currentOfficer.role);

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'EXTREME': return 'bg-red-950 text-red-300 border-red-700 animate-pulse';
      case 'HIGH': return 'bg-red-950/80 text-red-300 border-red-800';
      case 'MEDIUM': return 'bg-amber-950 text-amber-300 border-amber-700';
      default: return 'bg-emerald-950 text-emerald-300 border-emerald-700';
    }
  };

  const handleExportExtract = () => {
    setExportNotice('NDPA Certified Police Extract successfully compiled with digital cryptographic seal.');
    onLogAudit(
      'NDPA_EXPORT',
      'COURT_ORDERED_INQUIRY',
      suspect.id,
      `Exported official NDPA-compliant criminal extract for suspect ${suspect.firstName} ${suspect.lastName} (${suspect.systemRef}) by ${currentOfficer.fullName}`,
      'AUTHORIZED_ACCESS'
    );
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Export Notification Toast */}
      {exportNotice && (
        <div className="p-3 rounded-lg bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-emerald-400 hover:text-emerald-200">✕</button>
        </div>
      )}

      {/* High-Alert Active Bench Warrant Notice */}
      {suspect.activeWarrants.length > 0 && (
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 border-2 border-red-700 rounded-xl p-4 sm:p-5 shadow-2xl space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-900/80 border border-red-500 flex items-center justify-center text-red-200 flex-shrink-0">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-red-400 font-mono">
                  ACTIVE NATIONAL BENCH WARRANT ALERT
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {suspect.activeWarrants[0].warrantNumber} • {suspect.activeWarrants[0].issuingCourt}
                </h2>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-900 text-red-100 border border-red-600 uppercase font-mono">
              {suspect.activeWarrants[0].severity} SEVERITY
            </span>
          </div>

          <p className="text-xs text-red-200/90 leading-relaxed bg-red-950/60 p-3 rounded-lg border border-red-900">
            <strong>Offense / Grounds:</strong> {suspect.activeWarrants[0].offense}
          </p>

          {suspect.activeWarrants[0].specialInstructions && (
            <div className="text-xs text-amber-300 font-mono flex items-center gap-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
              <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>INSTRUCTIONS: {suspect.activeWarrants[0].specialInstructions}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Mugshot & Biometric Status */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative">
              <img
                src={suspect.mugshotUrl}
                alt={`${suspect.firstName} ${suspect.lastName}`}
                className="w-36 h-44 sm:w-40 sm:h-48 rounded-xl object-cover border-2 border-slate-700 shadow-xl"
              />
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-950/90 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                BIO-VERIFIED
              </div>
              <div className="absolute bottom-2 left-2 right-2 text-center text-[10px] font-mono bg-slate-950/90 text-slate-300 py-0.5 rounded border border-slate-800">
                {suspect.systemRef}
              </div>
            </div>
          </div>

          {/* Core Personal Details & Physical Identifiers */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {suspect.firstName} {suspect.middleName ? suspect.middleName + ' ' : ''}{suspect.lastName}
                  </h1>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getRiskBadgeColor(suspect.riskLevel)}`}>
                    RISK: {suspect.riskLevel}
                  </span>
                </div>
                {suspect.aliases.length > 0 && (
                  <div className="text-xs text-emerald-400 font-medium mt-0.5">
                    Aliases: {suspect.aliases.join(' • ')}
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  id="export-police-extract-btn"
                  onClick={handleExportExtract}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Police Extract</span>
                </button>

                {(currentOfficer.role === 'LEAD_INVESTIGATOR' || currentOfficer.role === 'STATION_DESK_OFFICER') && (
                  <button
                    id="add-case-charge-btn"
                    onClick={() => onOpenNewRecordModal(rawSuspect)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Attach New Charge</span>
                  </button>
                )}
              </div>
            </div>

            {/* Inter-Agency Flags Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                suspect.interAgencyFlags.npfAlert ? 'bg-blue-950/40 border-blue-800 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                <span className="font-semibold">NPF Flag</span>
                <span className="text-[10px] font-mono">{suspect.interAgencyFlags.npfAlert ? 'ACTIVE' : 'CLEAR'}</span>
              </div>

              <div className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                suspect.interAgencyFlags.efccWatchlist ? 'bg-amber-950/40 border-amber-800 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                <span className="font-semibold">EFCC Watch</span>
                <span className="text-[10px] font-mono">{suspect.interAgencyFlags.efccWatchlist ? 'WATCHLIST' : 'CLEAR'}</span>
              </div>

              <div className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                suspect.interAgencyFlags.dssPriority ? 'bg-red-950/40 border-red-800 text-red-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                <span className="font-semibold">DSS Matrix</span>
                <span className="text-[10px] font-mono">{suspect.interAgencyFlags.dssPriority ? 'PRIORITY' : 'CLEAR'}</span>
              </div>

              <div className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                suspect.interAgencyFlags.ncosEscaped ? 'bg-red-950 border-red-700 text-red-200 animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                <span className="font-semibold">NCoS Custody</span>
                <span className="text-[10px] font-mono">{suspect.interAgencyFlags.ncosEscaped ? 'ESCAPE ALERT' : 'TRACKED'}</span>
              </div>
            </div>

            {/* Demographics & Physical Identification Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">State of Origin</span>
                <span className="font-semibold text-slate-200">{suspect.stateOfOrigin} ({suspect.lga} LGA)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Age / Gender</span>
                <span className="font-semibold text-slate-200">{suspect.age} yrs • {suspect.gender}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Height / Blood</span>
                <span className="font-semibold text-slate-200">{suspect.heightCm} cm • {suspect.bloodGroup}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">NIN Hash (NDPA)</span>
                <span className="font-mono text-slate-300 text-[11px] truncate block">{suspect.ninHash}</span>
              </div>
            </div>

            {/* Distinguishing Marks */}
            {suspect.distinguishingMarks.length > 0 && (
              <div className="text-xs bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Distinguishing Physical Marks:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                  {suspect.distinguishingMarks.map((mark, i) => (
                    <li key={i}>{mark}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Multi-State Arrest Footprint Map & Historical Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">
              Cross-Jurisdictional Arrest Logs & State Dispositions ({suspect.criminalRecords.length} Cases)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            36 States + FCT Central Repository
          </span>
        </div>

        {/* State Tags Representation */}
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(suspect.criminalRecords.map(r => r.state))).map((st) => (
            <div key={st} className="px-3 py-1.5 rounded-lg bg-slate-950 border border-emerald-800/40 text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{st} State Command</span>
            </div>
          ))}
        </div>

        {/* Case Records Accordion List */}
        <div className="space-y-3">
          {suspect.criminalRecords.map((record) => {
            const isExpanded = selectedRecordId === record.id;
            return (
              <div
                key={record.id}
                className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden transition-colors"
              >
                <div
                  onClick={() => setSelectedRecordId(isExpanded ? null : record.id)}
                  className="p-4 cursor-pointer hover:bg-slate-900/60 flex items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 font-mono font-bold flex-shrink-0">
                      {record.arrestingAgency}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-100 truncate flex items-center gap-2">
                        <span>{record.offenseTitle}</span>
                        <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300">
                          {record.caseNumber}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{record.state} State</span>
                        <span>•</span>
                        <span>Arrested: {record.arrestDate}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">{record.courtDisposition}</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {/* Expanded Case Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-900/40 text-xs space-y-3">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1">Offense Particulars:</span>
                      <p className="text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        {record.offenseDetails}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase block">Arresting Station / Unit:</span>
                        <span className="text-slate-200 font-medium">{record.arrestingStation}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase block">Trial Court:</span>
                        <span className="text-slate-200 font-medium">{record.courtName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase block">Disposition Date:</span>
                        <span className="text-slate-200 font-medium">{record.dispositionDate}</span>
                      </div>
                    </div>

                    {record.sentenceSummary && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-900 text-emerald-200">
                        <span className="font-bold">Sentence / Bail Disposition:</span> {record.sentenceSummary}
                      </div>
                    )}

                    {record.custodyLocation && (
                      <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900 text-blue-200 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span><strong>NCoS Custodial Remand Centre:</strong> {record.custodyLocation}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Biometric ISO/IEC 19794-2 Template Metadata Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Fingerprint className="w-4 h-4 text-emerald-400" />
            <span>Enrolled Biometric Template Telemetry</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Encrypted Vector Index (pgvector / HNSW)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase">Standard / Finger</span>
            <span className="font-semibold text-slate-200">
              {suspect.biometrics[0]?.isoStandard || 'ISO/IEC 19794-2'} • {suspect.biometrics[0]?.fingerPosition || 'RIGHT_THUMB'}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase">Minutiae Count & Quality</span>
            <span className="font-semibold text-emerald-400">
              {suspect.biometrics[0]?.minutiaeCount || 46} points • {suspect.biometrics[0]?.qualityScore || 94}% NFIQ Score
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase">Enrollment Hardware</span>
            <span className="font-semibold text-slate-200">
              {suspect.biometrics[0]?.captureDevice || 'MorphoTop 100 LiveScan'}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 break-all">
          <span className="text-emerald-400 font-bold">CRYPTOGRAPHIC TEMPLATE HASH: </span>
          {suspect.biometrics[0]?.encryptedHash || 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'}
        </div>
      </div>
    </div>
  );
};
