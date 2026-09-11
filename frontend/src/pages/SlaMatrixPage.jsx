import React from 'react';
import { ArrowLeft, ShieldAlert, CheckCircle2, Clock, AlertTriangle, ArrowDown } from 'lucide-react';
import TicketTable from '../components/TicketTable';

export default function SlaMatrixPage({ tickets, onBack, onSelectTicket, onEscalateTicket }) {
  const escalatedTickets = tickets.filter(t => t.status === 'ESCALATED_ZONAL');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
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
              <span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span>
              <span className="text-xs uppercase tracking-wider font-mono font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded">
                Governance Matrix
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              SLA Escalation &amp; Verification Protocol
            </h1>
            <p className="text-sm text-slate-600">
              Automated 24h/48h hierarchical escalation with contractor verification
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block font-mono">
          <span className="text-xs text-red-600 block uppercase font-bold">Current Violations</span>
          <span className="text-3xl font-extrabold text-red-600">{escalatedTickets.length}</span>
        </div>
      </div>

      {/* Visual SLA Matrix Hierarchy Flowchart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold font-mono text-slate-900 uppercase tracking-wider mb-4">
          Municipal SLA Escalation Ladder
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Tier 1: Ward Contractor */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-5 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                Tier 1: Ward Level
              </span>
              <span className="text-xs font-mono font-bold text-blue-700">T &le; 24 Hours</span>
            </div>
            <h4 className="text-base font-bold text-slate-900">Ward Contractor</h4>
            <p className="text-xs text-slate-600 mt-1"><b>Contact:</b> abhimanu6729@gmail.com</p>
            <div className="mt-3 text-xs text-slate-700 bg-white p-3 rounded-lg border border-blue-100 space-y-1">
              <p>&bull; Receives email alert with Google Maps coordinates &amp; camera photo.</p>
              <p>&bull; Must submit Action Plan or mark Resolved with photo proof.</p>
            </div>
          </div>

          {/* Tier 2: Zonal Officer */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                Tier 2: Escalated
              </span>
              <span className="text-xs font-mono font-bold text-amber-700">T &gt; 24h &le; 48h</span>
            </div>
            <h4 className="text-base font-bold text-slate-900">Zonal Administration</h4>
            <p className="text-xs text-slate-600 mt-1"><b>Contact:</b> lingarajusaikumar@gmail.com</p>
            <div className="mt-3 text-xs text-slate-700 bg-white p-3 rounded-lg border border-amber-100 space-y-1">
              <p>&bull; Auto-alerted via URGENT email when contractor misses 24h SLA.</p>
              <p>&bull; Can summon contractor or deploy emergency municipal repair crew.</p>
            </div>
          </div>

          {/* Tier 3: Chief Administration */}
          <div className="bg-red-50/60 border border-red-200 rounded-xl p-5 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase font-mono bg-red-100 text-red-800 px-2 py-0.5 rounded">
                Tier 3: Executive
              </span>
              <span className="text-xs font-mono font-bold text-red-700">T &gt; 48 Hours</span>
            </div>
            <h4 className="text-base font-bold text-slate-900">Chief Municipal Authority</h4>
            <p className="text-xs text-slate-600 mt-1"><b>Role:</b> GHMC Commissioner / Mayor</p>
            <div className="mt-3 text-xs text-slate-700 bg-white p-3 rounded-lg border border-red-100 space-y-1">
              <p>&bull; Direct executive penalty assessment for contractor non-compliance.</p>
              <p>&bull; Public transparency log &amp; road safety audit registry.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Escalated Tickets Queue */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold font-mono text-red-700 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          Active Escalated Tickets Requiring Higher Authority Intervention ({escalatedTickets.length})
        </h3>
        <TicketTable
          tickets={escalatedTickets}
          totalCount={tickets.length}
          activeTab="sla"
          setActiveTab={() => {}}
          onSelectTicket={onSelectTicket}
          onEscalateTicket={onEscalateTicket}
        />
      </div>
    </div>
  );
}
