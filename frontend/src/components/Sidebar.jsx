import React from 'react';
import { LayoutDashboard, MapPin, Wrench, Activity, AlertCircle, FileCheck, ShieldAlert, Video } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, tickets, onOpenVideoModal }) {
  const getCategory = (t) => {
    const p = (t.problem || '').toLowerCase();
    if (['traffic', 'vehicle', 'bottleneck', 'car', 'bus', 'truck', 'motorcycle', 'auto', 'bicycle'].some(k => p.includes(k))) return 'traffic';
    if (['pedestrian', 'school', 'children', 'crossing', 'rash', 'hit_and_run', 'person', 'safety', 'conflict'].some(k => p.includes(k))) return 'safety';
    return 'road';
  };

  const roadIssuesCount = tickets.filter(t => getCategory(t) === 'road').length;
  const trafficCount = tickets.filter(t => getCategory(t) === 'traffic').length;
  const safetyCount = tickets.filter(t => getCategory(t) === 'safety').length;

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 hidden md:flex">
      <div className="overflow-y-auto py-5 px-4 space-y-7">
        {/* Navigation Section: Overview */}
        <div>
          <div className="text-xs uppercase tracking-wider font-mono font-bold text-slate-500 px-3 mb-2.5">
            Command Overview
          </div>
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-lg transition ${
                activeTab === 'workspace'
                  ? 'bg-[#0b2545] text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 text-blue-400" />
              Command Workspace
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold rounded-lg transition ${
                activeTab === 'map'
                  ? 'bg-[#0b2545] text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>Live GIS City Map</span>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded border border-emerald-300">
                HYD
              </span>
            </button>
          </nav>
        </div>

        {/* Navigation Section: AI Data Intelligence */}
        <div>
          <div className="text-xs uppercase tracking-wider font-mono font-bold text-slate-500 px-3 mb-2.5 flex items-center justify-between">
            <span>AI Intelligence</span>
            <span className="text-xs text-blue-700 font-bold">3 Engines</span>
          </div>
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('road')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-lg transition ${
                activeTab === 'road' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span>Road Infrastructure</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {roadIssuesCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('traffic')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-lg transition ${
                activeTab === 'traffic' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Traffic Intelligence</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {trafficCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('safety')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-lg transition ${
                activeTab === 'safety' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span>Safety Intelligence</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {safetyCount}
              </span>
            </button>
          </nav>
        </div>

        {/* Operations & Verification Workflow */}
        <div>
          <div className="text-xs uppercase tracking-wider font-mono font-bold text-slate-500 px-3 mb-2.5">
            Operations & Workflow
          </div>
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-lg transition ${
                activeTab === 'tickets' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Wrench className="w-5 h-5 text-blue-600" />
                <span>Active Master Tickets</span>
              </div>
              <span className="text-xs font-mono text-blue-800 bg-blue-100 font-bold px-2 py-0.5 rounded border border-blue-200">
                {tickets.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sla')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-lg transition ${
                activeTab === 'sla' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <span>SLA Escalation Matrix</span>
              </div>
              <span className="text-xs font-mono text-red-700 bg-red-50 font-bold px-2 py-0.5 rounded border border-red-200">
                24/48h
              </span>
            </button>
          </nav>
        </div>

        {/* Real-World Media Upload Trigger */}
        <div className="pt-3">
          <button
            onClick={onOpenVideoModal}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-[#0b2545] hover:bg-[#133560] text-white text-sm font-bold rounded-lg shadow-md transition"
          >
            <Video className="w-5 h-5 text-emerald-400" />
            Upload Road Video / Image
          </button>
        </div>
      </div>

      {/* Stakeholder Authority Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-700 space-y-1.5">
        <p className="font-bold text-slate-900 uppercase font-mono tracking-wider">Stakeholder Directory:</p>
        <p className="truncate"><b>Contractor:</b> abhimanu6729@gmail.com</p>
        <p className="truncate"><b>Higher Auth:</b> lingarajusaikumar@gmail.com</p>
      </div>
    </aside>
  );
}
