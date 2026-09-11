import React from 'react';
import { ArrowLeft, ShieldAlert, Users, AlertTriangle, UserCheck, Eye } from 'lucide-react';
import OpenStreetMap from '../components/OpenStreetMap';
import TicketTable from '../components/TicketTable';

export default function SafetyPage({ tickets, onBack, onSelectTicket, onEscalateTicket }) {
  const safetyTickets = tickets.filter((t) => {
    const p = (t.problem || '').toLowerCase();
    return ['pedestrian', 'school', 'children', 'crossing', 'rash', 'hit_and_run', 'person', 'safety', 'conflict'].some(k => p.includes(k));
  });

  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            title="Back to Command Workspace"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span>
              <span className="text-xs uppercase tracking-wider font-mono font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                AI Vision Engine 3
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              Public Safety &amp; Pedestrian Intelligence
            </h1>
            <p className="text-sm text-slate-600">
              Vulnerable road users, school zone crossings, near-miss vehicle conflicts &amp; rash driving surveillance
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block font-mono">
          <span className="text-xs text-slate-500 block uppercase">Critical Safety Hazards</span>
          <span className="text-3xl font-extrabold text-indigo-600">{safetyTickets.length}</span>
        </div>
      </div>

      {/* Safety Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono">School Zones Monitored</span>
          <div className="text-2xl font-extrabold text-indigo-700 mt-1">14 Zones</div>
          <span className="text-xs text-slate-500">Autonomous speed alert active</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono">Unsafe Crossings</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{safetyTickets.length || 2}</div>
          <span className="text-xs text-amber-600">Missing zebra marks flagged</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono">Near-Miss Conflicts</span>
          <div className="text-2xl font-extrabold text-red-600 mt-1">5 Today</div>
          <span className="text-xs text-slate-500">Bus proximity alerts</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono">ALPR Enforcement</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">Active</div>
          <span className="text-xs text-slate-500">License plate OCR tracker</span>
        </div>
      </div>

      {/* Safety Spatial Map */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
        <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
          Hyderabad Public Safety Hotspots Map
        </h3>
        <OpenStreetMap tickets={safetyTickets} onSelectTicket={onSelectTicket} />
      </div>

      {/* Safety Incident Queue */}
      <TicketTable
        tickets={safetyTickets}
        totalCount={tickets.length}
        activeTab="safety"
        setActiveTab={() => {}}
        onSelectTicket={onSelectTicket}
        onEscalateTicket={onEscalateTicket}
      />
    </div>
  );
}
