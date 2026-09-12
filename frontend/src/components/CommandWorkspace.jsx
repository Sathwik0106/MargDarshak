import React from 'react';
import { 
  MapPin, ShieldAlert, BarChart3, ChevronRight, 
  AlertTriangle, Clock, Eye, ArrowRight, CheckCircle2, UserCheck, ShieldCheck
} from 'lucide-react';
import KPICards from './KPICards';
import OpenStreetMap from './OpenStreetMap';

export default function CommandWorkspace({ 
  tickets = [], 
  onNavigate, 
  onSelectTicket, 
  onEscalateTicket 
}) {
  const getCategory = (t) => {
    const p = (t.problem || '').toLowerCase();
    if (['traffic', 'vehicle', 'bottleneck', 'car', 'bus', 'truck', 'motorcycle', 'auto', 'bicycle', 'congestion', 'signal', 'choke'].some(k => p.includes(k))) return 'traffic';
    if (['pedestrian', 'school', 'children', 'crossing', 'rash', 'hit_and_run', 'person', 'safety', 'conflict', 'hazard', 'dark', 'trench'].some(k => p.includes(k))) return 'safety';
    return 'road';
  };

  const roadCount = tickets.filter(t => getCategory(t) === 'road').length;
  const trafficCount = tickets.filter(t => getCategory(t) === 'traffic').length;
  const safetyCount = tickets.filter(t => getCategory(t) === 'safety').length;

  // Hyderabad Zone Distribution
  const hyderabadZones = [
    { name: '105 - Jubilee Hills', tickets: 28, risk: 'High', issue: 'Traffic Bottlenecks & Dividers', progress: 78, badgeColor: 'bg-red-50 text-red-700 border-red-200' },
    { name: '097 - Banjara Hills (Ward 12)', tickets: 24, risk: 'High', issue: 'High Pedestrian Conflict', progress: 82, badgeColor: 'bg-red-50 text-red-700 border-red-200' },
    { name: '042 - Secunderabad Cantt', tickets: 19, risk: 'Medium', issue: 'Potholes & Surface Subsidence', progress: 68, badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
    { name: '148 - Gachibowli Junction', tickets: 14, risk: 'Low', issue: 'Drainage Obstruction & Signage', progress: 89, badgeColor: 'bg-slate-100 text-slate-700 border-slate-200' },
    { name: '132 - Mehdipatnam Route', tickets: 12, risk: 'Medium', issue: 'Missing School Crossings', progress: 74, badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
  ];

  // Top 3 urgent tickets for Executive Attention Radar
  const urgentTickets = [...tickets]
    .sort((a, b) => {
      // Prioritize ESCALATED_ZONAL, then lowest remaining SLA seconds
      if (a.status === 'ESCALATED_ZONAL' && b.status !== 'ESCALATED_ZONAL') return -1;
      if (b.status === 'ESCALATED_ZONAL' && a.status !== 'ESCALATED_ZONAL') return 1;
      const aRem = a.sla_remaining_seconds !== undefined ? a.sla_remaining_seconds : 999999;
      const bRem = b.sla_remaining_seconds !== undefined ? b.sla_remaining_seconds : 999999;
      return aRem - bRem;
    })
    .slice(0, 3);

  // Municipal Circle Officers Turnaround Scorecard Data
  const officerScorecard = [
    {
      name: 'N. Sudhamsh',
      role: 'Deputy Commissioner (DC)',
      circle: 'Medchal Circle (Quthbullapur)',
      tasks: tickets.filter(t => (t.assigned_officer_name || '').includes('Sudhamsh') || (t.assigned_circle || '').includes('Medchal')).length || 12,
      onTimeRate: '97.1%',
      avgResponse: '3.9h',
      status: 'Compliant',
      statusColor: 'text-emerald-800 bg-emerald-50 border-emerald-200'
    },
    {
      name: 'D. Lavanya',
      role: 'Deputy Commissioner (DC)',
      circle: 'Kompally Circle (Quthbullapur)',
      tasks: tickets.filter(t => (t.assigned_officer_name || '').includes('Lavanya') || (t.assigned_circle || '').includes('Kompally')).length || 13,
      onTimeRate: '96.2%',
      avgResponse: '4.8h',
      status: 'Compliant',
      statusColor: 'text-emerald-800 bg-emerald-50 border-emerald-200'
    },
    {
      name: 'G. SRINIVAS',
      role: 'Deputy Commissioner (DC)',
      circle: 'Miyapur Circle (Serilingampally)',
      tasks: tickets.filter(t => (t.assigned_officer_name || '').includes('SRINIVAS') || (t.assigned_circle || '').includes('Miyapur')).length || 12,
      onTimeRate: '95.4%',
      avgResponse: '4.5h',
      status: 'Compliant',
      statusColor: 'text-emerald-800 bg-emerald-50 border-emerald-200'
    },
    {
      name: 'G. Anjaneyulu',
      role: 'Deputy Commissioner (DC)',
      circle: 'Kukatpally Circle (Kukatpally)',
      tasks: tickets.filter(t => (t.assigned_officer_name || '').includes('Anjaneyulu') || (t.assigned_circle || '').includes('Kukatpally')).length || 9,
      onTimeRate: '94.8%',
      avgResponse: '4.2h',
      status: 'Compliant',
      statusColor: 'text-emerald-800 bg-emerald-50 border-emerald-200'
    },
    {
      name: 'Jyoti Reddy',
      role: 'Deputy Commissioner (DC)',
      circle: 'Patancheruvu Circle (Serilingampally)',
      tasks: tickets.filter(t => (t.assigned_officer_name || '').includes('Jyoti') || (t.assigned_circle || '').includes('Patancheruvu')).length || 11,
      onTimeRate: '93.6%',
      avgResponse: '5.0h',
      status: 'Compliant',
      statusColor: 'text-emerald-800 bg-emerald-50 border-emerald-200'
    }
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* 1. Top Executive Metric Strip */}
      <section>
        <div className="mb-4">
          <h2 className="gov-section-header">Executive Situational Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time citywide defect sensing metrics &amp; statutory SLA compliance</p>
        </div>
        <KPICards tickets={tickets} />
      </section>

      {/* 2. Middle Section: Geospatial Hotspot Map + Ward Rankings + Vision Streams */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Geospatial Defect Hotspot Map (5 cols) */}
        <div className="lg:col-span-5 gov-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="gov-section-header text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-700" />
                  Geospatial Defect Hotspot Map
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live multi-fleet detection clusters across Hyderabad
                </p>
              </div>
              <button
                onClick={() => onNavigate('map')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 font-mono"
              >
                Expand GIS &rarr;
              </button>
            </div>

            {/* Interactive Miniature Map */}
            <div className="mt-4 rounded-xl overflow-hidden border border-slate-200/80 h-72 relative">
              <OpenStreetMap tickets={tickets} onSelectTicket={onSelectTicket} />
            </div>

            {/* Map Legend */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                <span>T+7 Escalated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span>Resolved</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>Filed (T+3)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ward Concentration Ranking (4 cols) */}
        <div className="lg:col-span-4 gov-card p-6 flex flex-col justify-between">
          <div>
            <div className="pb-3.5 border-b border-slate-100">
              <h3 className="gov-section-header text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-700" />
                Ward Concentration Ranking
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Defect ticket density ranked by municipal ward priority
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {hyderabadZones.map((zone, idx) => (
                <div key={idx} className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/70">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-900">{zone.name}</span>
                    <span className="text-[11px] font-mono font-semibold text-slate-600">
                      {zone.progress}% resolved
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span className="truncate pr-2">{zone.issue}</span>
                    <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] border ${zone.badgeColor}`}>
                      {zone.tickets} tickets
                    </span>
                  </div>

                  <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${zone.progress >= 80 ? 'bg-emerald-600' : 'bg-blue-600'}`} 
                      style={{ width: `${zone.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vision Intelligence Streams Summary (3 cols) */}
        <div className="lg:col-span-3 gov-card p-6 flex flex-col justify-between">
          <div>
            <div className="pb-3.5 border-b border-slate-100">
              <h3 className="gov-section-header text-base">
                Vision Streams
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                AI fleet automated transit detection
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {/* Stream 1 */}
              <div 
                onClick={() => onNavigate('road')}
                className="p-3.5 bg-slate-50/70 hover:bg-slate-100 border border-slate-200/70 rounded-xl cursor-pointer transition group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-900">Road Defects</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700" />
                </div>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="text-xl font-bold text-slate-900">{roadCount}</span>
                  <span className="text-[11px] font-mono text-slate-500">Potholes &amp; Pavement</span>
                </div>
              </div>

              {/* Stream 2 */}
              <div 
                onClick={() => onNavigate('traffic')}
                className="p-3.5 bg-slate-50/70 hover:bg-slate-100 border border-slate-200/70 rounded-xl cursor-pointer transition group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-semibold text-slate-900 group-hover:text-amber-900">Traffic Bottlenecks</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-700" />
                </div>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="text-xl font-bold text-slate-900">{trafficCount}</span>
                  <span className="text-[11px] font-mono text-amber-800">Congestion Points</span>
                </div>
              </div>

              {/* Stream 3 */}
              <div 
                onClick={() => onNavigate('safety')}
                className="p-3.5 bg-slate-50/70 hover:bg-slate-100 border border-slate-200/70 rounded-xl cursor-pointer transition group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="text-xs font-semibold text-slate-900 group-hover:text-red-900">Pedestrian Safety</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-700" />
                </div>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="text-xl font-bold text-slate-900">{safetyCount}</span>
                  <span className="text-[11px] font-mono text-red-700">Missing Crossings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Bottom Section: Executive SLA Attention Radar + Officer Compliance Scorecard */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Executive SLA Attention Radar (5 cols) */}
        <div className="lg:col-span-5 gov-card p-6 flex flex-col justify-between">
          <div>
            <div className="pb-3.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="gov-section-header text-base flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Executive SLA Attention Radar
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  High-priority tickets requiring immediate Zonal intervention
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                Urgent Actions
              </span>
            </div>

            {/* 3 Urgent Action Alert Cards */}
            <div className="mt-4 space-y-3">
              {urgentTickets.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-mono">
                  No urgent statutory breaches at this moment. All tickets within SLA.
                </div>
              ) : (
                urgentTickets.map((t, idx) => {
                  const isEscalated = t.status === 'ESCALATED_ZONAL';
                  return (
                    <div 
                      key={t.id} 
                      className={`p-3.5 rounded-lg border transition ${
                        isEscalated 
                          ? 'bg-red-50/50 border-red-200/80' 
                          : 'bg-slate-50/70 border-slate-200/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-xs">#{t.id}</span>
                          <span className="text-xs font-semibold text-slate-800 capitalize truncate max-w-[180px]">
                            {t.problem}
                          </span>
                        </div>
                        <button
                          onClick={() => onSelectTicket(t)}
                          className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 shrink-0"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs mt-1.5 font-mono">
                        <span className="text-slate-500 text-[11px]">
                          {t.assigned_circle || 'Circle 12'} &bull; {t.assigned_officer_name || 'Circle EE'}
                        </span>
                        {isEscalated ? (
                          <span className="text-red-700 font-bold text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-red-600" /> T+7 Breached
                          </span>
                        ) : (
                          <span className="text-amber-800 font-semibold text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" /> Stage Expiring
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Primary Action Button: Open Master Grievance Registry */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              onClick={() => onNavigate('tickets')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0a2540] hover:bg-[#153e6b] text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <span>Open Master Grievance Registry ({tickets.length} Records)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Circle Municipal Officer Compliance Turnaround Scorecard (7 cols) */}
        <div className="lg:col-span-7 gov-card p-6 flex flex-col justify-between">
          <div>
            <div className="pb-3.5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="gov-section-header text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  Circle Municipal Officer Compliance Scorecard
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statutory SLA turnaround rates and officer administrative accountability
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                T+3 &bull; T+5 &bull; T+7 Standards
              </span>
            </div>

            {/* Scorecard Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="gov-table w-full text-left text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="py-2.5 px-3">Circle Officer &amp; Jurisdiction</th>
                    <th className="py-2.5 px-3 text-center">Tasks Assigned</th>
                    <th className="py-2.5 px-3 text-center">Avg Response</th>
                    <th className="py-2.5 px-3 text-center">Resolution Rate</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {officerScorecard.map((officer, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{officer.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{officer.role} &bull; {officer.circle}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                        {officer.tasks}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-700">
                        {officer.avgResponse}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {officer.onTimeRate}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${officer.statusColor}`}>
                          {officer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>GHMC Urban Asset Management Division</span>
            <span>Automated Daily Sync &bull; 199 Officers</span>
          </div>
        </div>
      </section>
    </div>
  );
}
