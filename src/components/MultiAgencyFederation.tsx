import React, { useState } from 'react';
import { 
  Activity, 
  Building2, 
  ShieldCheck, 
  Radio, 
  RefreshCw, 
  Lock, 
  CheckCircle2, 
  Server, 
  ArrowUpRight,
  Database
} from 'lucide-react';
import { AgencyFederationStatus } from '../types';
import { AGENCY_FEDERATIONS } from '../data/mockData';

export const MultiAgencyFederation: React.FC = () => {
  const [federations, setFederations] = useState<AgencyFederationStatus[]>(AGENCY_FEDERATIONS);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingSuccessNotice, setPingSuccessNotice] = useState<string | null>(null);

  const handlePingAll = async () => {
    setIsPinging(true);
    await new Promise(r => setTimeout(r, 600));

    setFederations(prev => prev.map(fed => ({
      ...fed,
      latencyMs: Math.floor(28 + Math.random() * 35),
      lastSyncTime: new Date().toISOString(),
    })));

    setPingSuccessNotice('All 5 Federal Security Hubs Responding with Valid mTLS Handshake.');
    setIsPinging(false);
    setTimeout(() => setPingSuccessNotice(null), 4000);
  };

  const totalIndexedRecords = federations.reduce((acc, f) => acc + f.indexedRecordsCount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Inter-Agency Law Enforcement Matrix
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                  Federated mTLS
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Secure real-time cross-jurisdictional record retrieval across NPF, EFCC, DSS, NCoS, and NDLEA.
              </p>
            </div>
          </div>

          <button
            onClick={handlePingAll}
            disabled={isPinging}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
              isPinging
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/50 active:scale-[0.99]'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
            <span>{isPinging ? 'Broadcasting mTLS Ping...' : 'Refresh Agency Handshakes'}</span>
          </button>
        </div>

        {pingSuccessNotice && (
          <div className="p-3 rounded-lg bg-blue-950/70 border border-blue-600 text-xs text-blue-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{pingSuccessNotice}</span>
          </div>
        )}

        {/* Aggregate Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Total Indexed Biometric Dossiers:</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">{totalIndexedRecords.toLocaleString()}</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Active Agency Nodes:</span>
            <span className="font-bold text-blue-400 font-mono text-sm">5 of 5 Online</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Average Node Latency:</span>
            <span className="font-bold text-slate-200 font-mono text-sm">
              {Math.round(federations.reduce((acc, f) => acc + f.latencyMs, 0) / federations.length)} ms
            </span>
          </div>
        </div>
      </div>

      {/* Agency Node Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {federations.map((fed) => (
          <div
            key={fed.agency}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-bold text-emerald-400">
                  {fed.agency}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">{fed.name}</h3>
                  <p className="text-xs text-slate-400">{fed.systemName}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{fed.status} ({fed.latencyMs}ms)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">Indexed Case Files:</span>
                <span className="font-mono font-bold text-slate-200 text-sm">{fed.indexedRecordsCount.toLocaleString()}</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase block">Last Sync Telemetry:</span>
                <span className="font-mono text-slate-300 text-xs">{new Date(fed.lastSyncTime).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 bg-slate-950 p-2 rounded-lg border border-slate-800 truncate">
              <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">CRYPTO: {fed.encryptionMode}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
