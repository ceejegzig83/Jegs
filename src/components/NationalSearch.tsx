import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Shield, 
  CheckCircle2, 
  User, 
  MapPin, 
  ArrowRight,
  SlidersHorizontal,
  FileText
} from 'lucide-react';
import { Suspect, OfficerProfile } from '../types';
import { NIGERIAN_STATES } from '../data/mockData';

interface NationalSearchProps {
  suspects: Suspect[];
  currentOfficer: OfficerProfile;
  onSelectSuspect: (suspect: Suspect) => void;
}

export const NationalSearch: React.FC<NationalSearchProps> = ({
  suspects,
  currentOfficer,
  onSelectSuspect
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [onlyActiveWarrants, setOnlyActiveWarrants] = useState<boolean>(false);
  const [selectedAgencyFlag, setSelectedAgencyFlag] = useState<string>('ALL');

  const filteredSuspects = useMemo(() => {
    return suspects.filter((s) => {
      // Query filter (Name, Alias, SystemRef, NIN, LGA)
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || (
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.systemRef.toLowerCase().includes(q) ||
        s.aliases.some(a => a.toLowerCase().includes(q)) ||
        s.stateOfOrigin.toLowerCase().includes(q) ||
        s.lga.toLowerCase().includes(q) ||
        s.ninHash.toLowerCase().includes(q) ||
        s.criminalRecords.some(r => r.offenseTitle.toLowerCase().includes(q) || r.caseNumber.toLowerCase().includes(q))
      );

      // State filter
      const matchesState = selectedState === 'ALL' || s.stateOfOrigin === selectedState;

      // Risk filter
      const matchesRisk = selectedRisk === 'ALL' || s.riskLevel === selectedRisk;

      // Warrant filter
      const matchesWarrant = !onlyActiveWarrants || s.activeWarrants.length > 0;

      // Agency flag filter
      const matchesAgency = selectedAgencyFlag === 'ALL' || (
        (selectedAgencyFlag === 'NPF' && s.interAgencyFlags.npfAlert) ||
        (selectedAgencyFlag === 'EFCC' && s.interAgencyFlags.efccWatchlist) ||
        (selectedAgencyFlag === 'DSS' && s.interAgencyFlags.dssPriority) ||
        (selectedAgencyFlag === 'NCOS' && s.interAgencyFlags.ncosEscaped)
      );

      return matchesQuery && matchesState && matchesRisk && matchesWarrant && matchesAgency;
    });
  }, [suspects, searchQuery, selectedState, selectedRisk, onlyActiveWarrants, selectedAgencyFlag]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-400" />
              <span>National Repository Query Engine</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Federated database search covering all 36 States and the Federal Capital Territory (FCT).
            </p>
          </div>
          <div className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
            Total Records: {suspects.length} Active Profiles
          </div>
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            id="national-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by suspect name, alias, system reference (NCRIMS-NG-...), NIN token, case title, or LGA..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">State of Origin:</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
            >
              <option value="ALL">All States (36 + FCT)</option>
              {NIGERIAN_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Risk Classification:</label>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="EXTREME">EXTREME (Terror / Insurgency)</option>
              <option value="HIGH">HIGH (Armed / Major Crime)</option>
              <option value="MEDIUM">MEDIUM (Financial / Cyber)</option>
              <option value="LOW">LOW (Misdemeanor)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Inter-Agency Matrix Watch:</label>
            <select
              value={selectedAgencyFlag}
              onChange={(e) => setSelectedAgencyFlag(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
            >
              <option value="ALL">All Agency Alerts</option>
              <option value="NPF">NPF State Alerts</option>
              <option value="EFCC">EFCC Watchlist</option>
              <option value="DSS">DSS National Priority</option>
              <option value="NCOS">NCoS Escapee Radar</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                Active Warrants Only
              </span>
              <input
                type="checkbox"
                checked={onlyActiveWarrants}
                onChange={(e) => setOnlyActiveWarrants(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-0 focus:ring-offset-0 bg-slate-900 border-slate-700"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Search Results Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Found {filteredSuspects.length} Matching Profiles</span>
          <span>Click any card to inspect full legal dossier</span>
        </div>

        {filteredSuspects.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-300">No matching suspect profiles found</p>
            <p className="text-xs text-slate-500 mt-1">Try relaxing your search terms or state filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSuspects.map((s) => (
              <div
                key={s.id}
                onClick={() => onSelectSuspect(s)}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl group space-y-3"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={s.mugshotUrl}
                    alt={s.lastName}
                    className="w-16 h-20 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                        {s.firstName} {s.lastName}
                      </h3>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase font-mono ${
                        s.riskLevel === 'EXTREME' || s.riskLevel === 'HIGH'
                          ? 'bg-red-950 text-red-300 border-red-800'
                          : s.riskLevel === 'MEDIUM'
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}>
                        {s.riskLevel}
                      </span>
                    </div>

                    <div className="text-xs text-emerald-400 font-medium truncate mt-0.5">
                      {s.aliases.length > 0 ? `Alias: ${s.aliases[0]}` : 'No Alias'}
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono mt-1">
                      Ref: {s.systemRef} • {s.stateOfOrigin} State
                    </div>

                    <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-2">
                      <span>{s.criminalRecords.length} Cases</span>
                      <span>•</span>
                      <span>{s.biometrics.length} Enrolled Fingerprints</span>
                    </div>
                  </div>
                </div>

                {/* Active Warrant Alert Strip */}
                {s.activeWarrants.length > 0 && (
                  <div className="p-2 rounded-lg bg-red-950/80 border border-red-800 text-[11px] text-red-200 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold truncate">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                      <span className="truncate">WARRANT: {s.activeWarrants[0].warrantNumber}</span>
                    </div>
                    <span className="text-[10px] text-red-400 font-mono uppercase flex-shrink-0 ml-2">ACTIVE</span>
                  </div>
                )}

                {/* Card Footer */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span className="truncate">Last Seen: {s.lastKnownLocation.city}, {s.lastKnownLocation.state}</span>
                  <span className="text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
