import React from 'react';
import { Shield, Bell, AlertTriangle, Radio } from 'lucide-react';

export default function Header({ tickets, onEmergencyEscalate }) {
  const escalatedCount = tickets.filter(t => t.status === 'ESCALATED_ZONAL').length;

  return (
    <header className="bg-[#0b2545] border-b border-[#133560] sticky top-0 z-50 shadow-md">
      <div className="px-5 py-3 flex items-center justify-between gap-4">
        {/* Left: Emblem & National Identity */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#091e3a] border border-amber-400/50 shadow-inner">
            <Shield className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <span className="text-xs uppercase tracking-wider font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded">
                Government of Telangana • GHMC
              </span>
              <span className="text-xs uppercase tracking-wider font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 radar-pulse inline-block"></span>
                AI Model: YOLO26m Active
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
              CITY ROAD INTELLIGENCE PLATFORM
              <span className="text-sm font-normal text-slate-300 hidden lg:inline border-l border-slate-600 pl-3">
                MargDarshak Mobile Fleet Sensing System
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Real-time Ingestion Stream Status */}
        <div className="hidden xl:flex items-center gap-6 bg-[#091e3a]/90 px-5 py-2 rounded-lg border border-[#1e4b85]">
          <div className="flex items-center gap-2 pr-4 border-r border-slate-700">
            <span className="text-sm font-bold text-slate-100">Hyderabad (GHMC Command)</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-mono text-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Sync:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> Live (8s)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Transit Fleet:</span>
              <span className="text-white font-bold">18 Buses Online</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Dedup:</span>
              <span className="text-sky-300 font-bold">&le; 7m Radius</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Contractor:</span>
              <span className="text-amber-300 font-bold">abhimanu6729</span>
            </div>
          </div>
        </div>

        {/* Right: Emergency Actions & User Profile */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={onEmergencyEscalate}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg border border-red-500 shadow-md transition"
          >
            <AlertTriangle className="w-4 h-4" />
            Emergency Escalation
          </button>

          <div className="relative p-2 text-slate-200 hover:text-white bg-[#091e3a] rounded-lg border border-slate-700">
            <Bell className="w-5 h-5" />
            {escalatedCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-mono text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-[#0b2545]">
                {escalatedCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 bg-[#091e3a] hover:bg-[#133560] px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white shadow-inner">
              KR
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <p className="text-sm font-bold text-slate-100">Er. K. Ramanathan</p>
              <p className="text-xs text-slate-300 font-mono">Chief Zonal Officer (Ward 12)</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
