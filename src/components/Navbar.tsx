import React from 'react';
import { 
  Shield, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  UserCheck, 
  AlertTriangle,
  FileText,
  Search,
  Fingerprint,
  HardDrive,
  Activity,
  ChevronDown
} from 'lucide-react';
import { OfficerProfile, UserRole } from '../types';
import { INITIAL_OFFICERS } from '../data/mockData';

interface NavbarProps {
  currentOfficer: OfficerProfile;
  onSelectOfficer: (officer: OfficerProfile) => void;
  activeTab: 'scanner' | 'dossier' | 'search' | 'offline' | 'audit' | 'federation';
  onSelectTab: (tab: 'scanner' | 'dossier' | 'search' | 'offline' | 'audit' | 'federation') => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  pendingOfflineCount: number;
  onTriggerSync: () => void;
  activeSuspectName?: string;
  hasActiveWarrantsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentOfficer,
  onSelectOfficer,
  activeTab,
  onSelectTab,
  isOffline,
  onToggleOffline,
  pendingOfflineCount,
  onTriggerSync,
  activeSuspectName,
  hasActiveWarrantsCount
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = React.useState(false);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'FIELD_OFFICER': return 'Field Officer (Patrol / Checkpoint)';
      case 'LEAD_INVESTIGATOR': return 'Lead Investigator / Detective';
      case 'STATION_DESK_OFFICER': return 'Station Desk Officer';
      case 'NDPA_AUDITOR': return 'NDPA Compliance Auditor';
      case 'SYSTEM_ADMIN': return 'National System Administrator';
    }
  };

  const getAgencyColor = (agency: string) => {
    switch (agency) {
      case 'NPF': return 'bg-blue-900/40 text-blue-300 border-blue-700/50';
      case 'EFCC': return 'bg-amber-900/40 text-amber-300 border-amber-700/50';
      case 'DSS': return 'bg-red-950/40 text-red-300 border-red-800/50';
      case 'NCOS': return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 sticky top-0 z-50">
      {/* Top Federal Security Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-950 to-emerald-950 border-b border-emerald-900/40 px-4 py-1 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            FEDERAL REPUBLIC OF NIGERIA
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">Ministry of Police Affairs & Law Enforcement Inter-Agency Council</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">
            NDPA 2023 Compliant • AES-256-GCM Encrypted
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 text-slate-300 border border-slate-800">
            <span className="text-emerald-400">AUTH:</span> {currentOfficer.badgeNumber}
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('scanner')}>
            <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-600/50 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-950/50">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white font-mono">N-CRIMS</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v2.6 Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none hidden sm:block">
                Nigerian Criminal Record Identification & Matching System
              </p>
            </div>
          </div>

          {/* Navigation Controls & Status Center */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Offline Mode Toggle Button */}
            <button
              id="offline-toggle-btn"
              onClick={onToggleOffline}
              title="Toggle Field Offline Mode for Remote Patrols"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                isOffline 
                  ? 'bg-amber-950/70 border-amber-600 text-amber-300 shadow-sm shadow-amber-900/40 animate-pulse' 
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
              }`}
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">FIELD OFFLINE</span>
                  <span className="sm:hidden">OFFLINE</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">CENTRAL ONLINE</span>
                  <span className="sm:hidden">ONLINE</span>
                </>
              )}
            </button>

            {/* Offline Queue Badge & Sync Action */}
            {pendingOfflineCount > 0 && (
              <button
                id="sync-queue-btn"
                onClick={onTriggerSync}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-blue-950/80 border border-blue-600 text-blue-300 hover:bg-blue-900/80 transition-colors"
                title={`${pendingOfflineCount} offline scans pending national synchronization`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                <span>Sync Queue</span>
                <span className="w-4 h-4 rounded-full bg-blue-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                  {pendingOfflineCount}
                </span>
              </button>
            )}

            {/* Active Warrants Alert Pill */}
            {hasActiveWarrantsCount > 0 && (
              <div 
                onClick={() => onSelectTab('search')}
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-red-950/80 border border-red-700 text-red-300 cursor-pointer hover:bg-red-900/80 transition-colors"
                title="Active High-Priority National Warrants"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span>{hasActiveWarrantsCount} Active Warrants</span>
              </div>
            )}

            {/* Officer Profile & Role Selector Dropdown */}
            <div className="relative">
              <button
                id="officer-role-switcher"
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-left transition-colors"
              >
                <img
                  src={currentOfficer.avatarUrl}
                  alt={currentOfficer.fullName}
                  className="w-7 h-7 rounded-full object-cover border border-slate-600"
                />
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
                    {currentOfficer.fullName}
                    <span className={`text-[10px] px-1 py-0.2 rounded border font-mono ${getAgencyColor(currentOfficer.agency)}`}>
                      {currentOfficer.agency}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                    {currentOfficer.rank}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Role Dropdown Menu */}
              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <div className="text-xs font-bold text-slate-200">Switch Officer Identity / Role</div>
                    <div className="text-[11px] text-slate-400">
                      Simulate different RBAC access tiers & NDPA data redaction levels.
                    </div>
                  </div>

                  <div className="space-y-1">
                    {INITIAL_OFFICERS.map((officer) => (
                      <button
                        key={officer.id}
                        onClick={() => {
                          onSelectOfficer(officer);
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors ${
                          officer.id === currentOfficer.id
                            ? 'bg-emerald-950/60 border border-emerald-700/60 text-white'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <img
                          src={officer.avatarUrl}
                          alt={officer.fullName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700 mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold flex items-center justify-between">
                            <span>{officer.fullName}</span>
                            <span className={`text-[9px] px-1 py-0.5 rounded border font-mono ${getAgencyColor(officer.agency)}`}>
                              {officer.agency}
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-400 font-medium">{getRoleLabel(officer.role)}</div>
                          <div className="text-[10px] text-slate-400 truncate">{officer.station}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800 px-3 py-1 text-[10px] text-slate-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>MFA Token Verified • NDPA Audit Logged</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/60">
          <button
            id="tab-scanner"
            onClick={() => onSelectTab('scanner')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'scanner'
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Fingerprint className="w-4 h-4 text-emerald-400" />
            <span>Biometric Scanner</span>
          </button>

          <button
            id="tab-dossier"
            onClick={() => onSelectTab('dossier')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'dossier'
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Suspect Dossier {activeSuspectName && <span className="opacity-75">({activeSuspectName.split(' ')[0]})</span>}</span>
          </button>

          <button
            id="tab-search"
            onClick={() => onSelectTab('search')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'search'
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Search className="w-4 h-4 text-emerald-400" />
            <span>National Repository (36 States + FCT)</span>
          </button>

          <button
            id="tab-offline"
            onClick={() => onSelectTab('offline')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'offline'
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>Offline Sync Queue</span>
            {pendingOfflineCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                {pendingOfflineCount}
              </span>
            )}
          </button>

          <button
            id="tab-audit"
            onClick={() => onSelectTab('audit')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'audit'
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Immutable NDPA Audit Trail</span>
          </button>

          <button
            id="tab-federation"
            onClick={() => onSelectTab('federation')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'federation'
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 text-blue-400" />
            <span>Inter-Agency Matrix</span>
          </button>
        </div>
      </div>
    </header>
  );
};
