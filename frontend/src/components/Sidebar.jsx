import React from 'react';
import { 
  LayoutDashboard, MapPin, Wrench, ShieldAlert, 
  Phone, ChevronRight, Users, Shield, HardHat, Building2
} from 'lucide-react';

export default function Sidebar({ 
  portalMode = 'admin', 
  activeTab, 
  setActiveTab, 
  tickets = [] 
}) {
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
      {/* Upper Navigation Section */}
      <div className="py-6 px-4 space-y-7 overflow-y-auto">
        
        {/* ========================================================
            ADMIN PORTAL SIDEBAR: Command, Live GIS, Grievance, 48h SLA
           ======================================================== */}
        {portalMode === 'admin' ? (
          <>
            {/* 1. EXECUTIVE COMMAND */}
            <div>
              <div className="gov-card-label px-3 mb-2.5 text-[11px] text-slate-400">
                Executive Command
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('workspace')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-lg transition ${
                    activeTab === 'workspace'
                      ? 'bg-slate-100 text-[#0a2540] font-bold border-l-4 border-[#0a2540]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className={`w-4 h-4 ${activeTab === 'workspace' ? 'text-[#0a2540]' : 'text-slate-400'}`} />
                    <span>Command Workspace</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${activeTab === 'workspace' ? 'text-[#0a2540]' : 'text-slate-300'}`} />
                </button>

                <button
                  onClick={() => setActiveTab('map')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-lg transition ${
                    activeTab === 'map'
                      ? 'bg-slate-100 text-[#0a2540] font-bold border-l-4 border-[#0a2540]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className={`w-4 h-4 ${activeTab === 'map' ? 'text-blue-700' : 'text-slate-400'}`} />
                    <span>Live GIS City Map</span>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded border border-slate-200">
                    HYD
                  </span>
                </button>
              </nav>
            </div>

            {/* 2. OPERATIONS & GOVERNANCE */}
            <div>
              <div className="gov-card-label px-3 mb-2.5 text-[11px] text-slate-400">
                Operations &amp; Governance
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('tickets')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-lg transition ${
                    activeTab === 'tickets'
                      ? 'bg-slate-100 text-[#0a2540] font-bold border-l-4 border-[#0a2540]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Wrench className={`w-4 h-4 ${activeTab === 'tickets' ? 'text-[#0a2540]' : 'text-slate-400'}`} />
                    <span>Grievance Registry</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {tickets.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('sla')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-lg transition ${
                    activeTab === 'sla'
                      ? 'bg-red-50 text-red-900 font-bold border-l-4 border-red-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>SLA Escalation Matrix</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-red-700 bg-red-100/80 px-1.5 py-0.5 rounded">
                    T+7 SLA
                  </span>
                </button>
              </nav>
            </div>
          </>
        ) : (
          /* ========================================================
             USER / CITIZEN PORTAL SIDEBAR: Road Infra, Traffic, Safety, Report
             ======================================================== */
          <>
            <div>
              <div className="gov-card-label px-3 mb-2.5 text-[11px] text-slate-400">
                Citizen Portal
              </div>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('citizen_workspace')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-lg transition ${
                    activeTab === 'citizen_workspace'
                      ? 'bg-slate-100 text-[#0a2540] font-bold border-l-4 border-[#0a2540]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 text-slate-400" />
                    <span>Grievance Tracker</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={() => setActiveTab('road')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-lg transition ${
                    activeTab === 'road'
                      ? 'bg-slate-100 text-slate-900 font-bold border-l-4 border-blue-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>Road Infrastructure</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {roadIssuesCount}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('traffic')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-lg transition ${
                    activeTab === 'traffic'
                      ? 'bg-slate-100 text-slate-900 font-bold border-l-4 border-amber-500'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>Traffic Flow &amp; Congestion</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {trafficCount}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('safety')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-lg transition ${
                    activeTab === 'safety'
                      ? 'bg-slate-100 text-slate-900 font-bold border-l-4 border-red-500'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span>Pedestrian &amp; Safety</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {safetyCount}
                  </span>
                </button>
              </nav>
            </div>
          </>
        )}
      </div>

      {/* Intentionally Balanced Lower Area (Eliminating Empty Dead Zone) */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
        {portalMode === 'admin' ? (
          <>
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>GHMC Zonal Executive Directory</span>
            </div>
            
            <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400 text-[11px]">Medchal DC:</span>
                  <span className="font-semibold text-slate-800 text-[11px]">N. Sudhamsh</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400 text-[11px]">Kompally DC:</span>
                  <span className="font-semibold text-slate-800 text-[11px]">D. Lavanya</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400 text-[11px]">Miyapur DC:</span>
                  <span className="font-semibold text-slate-800 text-[11px]">G. Srinivas</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400 text-[11px]">Kukatpally DC:</span>
                  <span className="font-semibold text-slate-800 text-[11px]">G. Anjaneyulu</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400 text-[11px]">Patancheruvu DC:</span>
                  <span className="font-semibold text-slate-800 text-[11px]">Jyoti Reddy</span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-slate-100">
                  <span className="text-slate-400 text-[11px]">Zonal Comm:</span>
                  <span className="font-semibold text-slate-800 text-[11px]">Pinkeshkumar IAS</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
              <span>MargDarshak v2.4</span>
              <span>T+3, T+5, T+7</span>
            </div>
          </>
        ) : (
          <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Citizen Support 24x7</span>
            </div>
            <p className="text-xs text-slate-600">
              Toll-Free Helpline: <b className="font-mono text-slate-900">155304</b>
            </p>
            <p className="text-[11px] text-slate-400">
              Greater Hyderabad Municipal Corporation Grievance Portal
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
