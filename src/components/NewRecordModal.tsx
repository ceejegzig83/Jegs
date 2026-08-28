import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  FilePlus, 
  Scale, 
  AlertTriangle, 
  CheckCircle2, 
  Building2,
  MapPin
} from 'lucide-react';
import { Suspect, CriminalRecord, Warrant, OfficerProfile } from '../types';
import { NIGERIAN_STATES } from '../data/mockData';

interface NewRecordModalProps {
  suspect: Suspect | null;
  isOpen: boolean;
  onClose: () => void;
  onAddRecord: (suspectId: string, record: CriminalRecord, warrant?: Warrant) => void;
  currentOfficer: OfficerProfile;
}

export const NewRecordModal: React.FC<NewRecordModalProps> = ({
  suspect,
  isOpen,
  onClose,
  onAddRecord,
  currentOfficer
}) => {
  if (!isOpen || !suspect) return null;

  const [offenseTitle, setOffenseTitle] = useState('');
  const [offenseCategory, setOffenseCategory] = useState<CriminalRecord['offenseCategory']>('Financial & Cybercrime');
  const [offenseDetails, setOffenseDetails] = useState('');
  const [caseNumber, setCaseNumber] = useState(`FHC/L/${Math.floor(100 + Math.random() * 899)}C/2026`);
  const [state, setState] = useState(suspect.stateOfOrigin || 'Lagos');
  const [incidentLocation, setIncidentLocation] = useState('Ikeja GRA, Lagos State');
  const [courtName, setCourtName] = useState('Federal High Court, Court 2, Lagos');
  const [courtDisposition, setCourtDisposition] = useState<CriminalRecord['courtDisposition']>('Remanded in Custody');
  const [sentenceSummary, setSentenceSummary] = useState('');
  const [custodyLocation, setCustodyLocation] = useState('Medium Security Custodial Centre, Kirikiri, Lagos');

  // Warrant toggle
  const [issueWarrant, setIssueWarrant] = useState(false);
  const [warrantNumber, setWarrantNumber] = useState(`FHC/WAR/2026/${Math.floor(100 + Math.random() * 899)}`);
  const [issuingJudge, setIssuingJudge] = useState('Hon. Justice A. M. Liman');
  const [warrantSeverity, setWarrantSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offenseTitle.trim()) return;

    const newRecord: CriminalRecord = {
      id: `CR-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      caseNumber,
      offenseCategory,
      offenseTitle,
      offenseDetails,
      arrestDate: new Date().toISOString().split('T')[0],
      incidentLocation,
      arrestingAgency: currentOfficer.agency,
      arrestingStation: currentOfficer.station,
      state,
      courtName,
      courtDisposition,
      dispositionDate: new Date().toISOString().split('T')[0],
      sentenceSummary: sentenceSummary || undefined,
      custodyLocation: courtDisposition === 'Remanded in Custody' || courtDisposition === 'Convicted & Sentenced' ? custodyLocation : undefined,
    };

    let newWarrant: Warrant | undefined;
    if (issueWarrant) {
      newWarrant = {
        id: `WAR-2026-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        warrantNumber,
        issuingCourt: courtName,
        issuingJudge,
        issuingState: state,
        dateIssued: new Date().toISOString().split('T')[0],
        expiryDate: '2028-12-31',
        status: 'ACTIVE',
        severity: warrantSeverity,
        offense: `Bench Warrant: ${offenseTitle} (Charge No: ${caseNumber})`,
        specialInstructions: 'Apprehend and remand in nearest state custodial facility pending court presentation.',
      };
    }

    onAddRecord(suspect.id, newRecord, newWarrant);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in-50">
        {/* Modal Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-600 flex items-center justify-center text-emerald-400">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Attach New Criminal Charge & Incident Entry
              </h2>
              <p className="text-xs text-slate-400">
                Suspect: <span className="text-emerald-400 font-semibold">{suspect.firstName} {suspect.lastName}</span> ({suspect.systemRef})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Offense Category:</label>
              <select
                value={offenseCategory}
                onChange={(e) => setOffenseCategory(e.target.value as CriminalRecord['offenseCategory'])}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                <option value="Financial & Cybercrime">Financial & Cybercrime</option>
                <option value="Violent Crime">Violent Crime</option>
                <option value="National Security">National Security</option>
                <option value="Narcotics">Narcotics</option>
                <option value="Arms & Smuggling">Arms & Smuggling</option>
                <option value="Public Order">Public Order</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Charge Sheet / Case Number:</label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Offense Title / Count Description:</label>
            <input
              type="text"
              value={offenseTitle}
              onChange={(e) => setOffenseTitle(e.target.value)}
              placeholder="e.g., Conspiracy to Defraud, Armed Highway Robbery, or Cyber-Terrorism"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Incident Particulars & Evidence Summary:</label>
            <textarea
              value={offenseDetails}
              onChange={(e) => setOffenseDetails(e.target.value)}
              rows={3}
              placeholder="Detailed chronological facts of the arrest, seized exhibits, and investigation findings..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">State Command Jurisdiction:</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                {NIGERIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Incident Location / LGA:</label>
              <input
                type="text"
                value={incidentLocation}
                onChange={(e) => setIncidentLocation(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Trial Court / Magistrate:</label>
              <input
                type="text"
                value={courtName}
                onChange={(e) => setCourtName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Court Disposition:</label>
              <select
                value={courtDisposition}
                onChange={(e) => setCourtDisposition(e.target.value as CriminalRecord['courtDisposition'])}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                <option value="Remanded in Custody">Remanded in Custody</option>
                <option value="Awaiting Trial">Awaiting Trial</option>
                <option value="Convicted & Sentenced">Convicted & Sentenced</option>
                <option value="Bail Granted">Bail Granted</option>
                <option value="Under Investigation">Under Investigation</option>
              </select>
            </div>
          </div>

          {courtDisposition === 'Remanded in Custody' && (
            <div>
              <label className="text-slate-300 font-semibold block mb-1">NCoS Custodial Facility:</label>
              <input
                type="text"
                value={custodyLocation}
                onChange={(e) => setCustodyLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              />
            </div>
          )}

          {/* Optional Bench Warrant Broadcast */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={issueWarrant}
                onChange={(e) => setIssueWarrant(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 focus:ring-0 bg-slate-950 border-slate-700"
              />
              <span className="font-bold text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Issue Nationwide Judicial Bench Warrant on Record
              </span>
            </label>

            {issueWarrant && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Warrant Ref Number:</label>
                    <input
                      type="text"
                      value={warrantNumber}
                      onChange={(e) => setWarrantNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Presiding Judge:</label>
                    <input
                      type="text"
                      value={issuingJudge}
                      onChange={(e) => setIssuingJudge(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px]">Severity Classification:</label>
                    <select
                      value={warrantSeverity}
                      onChange={(e) => setWarrantSeverity(e.target.value as 'CRITICAL' | 'HIGH' | 'MEDIUM')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-200 text-xs"
                    >
                      <option value="CRITICAL">CRITICAL (Arms/Terror)</option>
                      <option value="HIGH">HIGH (Felony)</option>
                      <option value="MEDIUM">MEDIUM (Bail Breach)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition-all shadow-lg shadow-emerald-950/50"
            >
              Commit Charge to Central Registry & Audit Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
