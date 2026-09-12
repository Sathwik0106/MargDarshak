import React from 'react';
import { ArrowLeft, Wrench, AlertTriangle, CheckCircle2, ThumbsUp, Camera } from 'lucide-react';
import OpenStreetMap from '../components/OpenStreetMap';
import TicketTable from '../components/TicketTable';

export default function RoadInfraPage({ tickets, portalMode = 'user', onBack, onSelectTicket, onEscalateTicket, onVote }) {
  const roadTickets = tickets.filter((t) => {
    const p = (t.problem || '').toLowerCase();
    return !['traffic', 'vehicle', 'car', 'bus', 'truck', 'pedestrian', 'person', 'school'].some(k => p.includes(k));
  });

  const potholes = roadTickets.filter(t => t.problem.toLowerCase().includes('pothole')).length;
  const roadDamage = roadTickets.filter(t => t.problem.toLowerCase().includes('damage') || t.problem.toLowerCase().includes('crack')).length;
  const signboards = roadTickets.filter(t => t.problem.toLowerCase().includes('sign') || t.problem.toLowerCase().includes('divider') || t.problem.toLowerCase().includes('zebra')).length;
  const waterlogging = roadTickets.filter(t => t.problem.toLowerCase().includes('water')).length;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Page Banner */}
      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
              <span className="text-xs uppercase tracking-wider font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                AI Vision Engine 1
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              Road Infrastructure Intelligence
            </h1>
            <p className="text-sm text-slate-600">
              Automated detection of potholes, surface cracks, missing dividers, signboards &amp; waterlogging
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block font-mono">
          <span className="text-xs text-slate-500 block uppercase">Total Road Defects</span>
          <span className="text-3xl font-extrabold text-emerald-700">{roadTickets.length}</span>
        </div>
      </div>

      {/* Road Sub-category Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono">Potholes Detected</span>
          <div className="text-2xl font-extrabold text-red-600 mt-1">{potholes}</div>
          <span className="text-xs text-slate-500">Depth &gt; 5cm flagged</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono">Surface Damage</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{roadDamage}</div>
          <span className="text-xs text-slate-500">Cracks &amp; rutting</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono">Signs &amp; Dividers</span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">{signboards}</div>
          <span className="text-xs text-slate-500">Missing / Damaged</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono">Waterlogging</span>
          <div className="text-2xl font-extrabold text-cyan-600 mt-1">{waterlogging}</div>
          <span className="text-xs text-slate-500">Drainage obstruction</span>
        </div>
      </div>

      {/* Road Specific Spatial Map */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
        <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          Hyderabad Road Infrastructure Defect Map
        </h3>
        <OpenStreetMap tickets={roadTickets} onSelectTicket={onSelectTicket} />
      </div>

      {/* Road Defects Table */}
      <TicketTable
        tickets={roadTickets}
        totalCount={tickets.length}
        activeTab="road"
        setActiveTab={() => {}}
        onSelectTicket={onSelectTicket}
        onEscalateTicket={onEscalateTicket}
        onVote={onVote}
        portalMode={portalMode}
      />
    </div>
  );
}
