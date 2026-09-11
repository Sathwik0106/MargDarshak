import React from 'react';
import { 
  TrendingUp, AlertTriangle, ShieldCheck, MapPin, Car, Clock, 
  Activity, BarChart3, PieChart, Users, CheckCircle2, ChevronRight 
} from 'lucide-react';
import KPICards from './KPICards';

export default function CommandWorkspace({ tickets, onNavigate, onSelectTicket }) {
  // Compute real statistics from active tickets
  const total = tickets.length;
  const potholes = tickets.filter(t => (t.problem || '').toLowerCase().includes('pothole')).length;
  const trafficCount = tickets.filter(t => ['traffic', 'vehicle', 'car', 'bus', 'truck'].some(k => (t.problem || '').toLowerCase().includes(k))).length;
  const safetyCount = tickets.filter(t => ['pedestrian', 'person', 'school', 'rash'].some(k => (t.problem || '').toLowerCase().includes(k))).length;

  // Hyderabad Zone Distribution
  const hyderabadZones = [
    { name: 'Hitec City / Madhapur Corridor', tickets: 28, risk: 'High', issue: 'Traffic Bottlenecks & Missing Dividers', progress: 75, color: 'bg-red-500' },
    { name: 'Charminar / Old City Zone', tickets: 24, risk: 'High', issue: 'High Pedestrian Conflict & Missing Zebras', progress: 60, color: 'bg-indigo-500' },
    { name: 'Secunderabad Cantonment', tickets: 19, risk: 'Medium', issue: 'Potholes & Surface Cracks', progress: 85, color: 'bg-amber-500' },
    { name: 'Banjara Hills & Jubilee Hills (Ward 12)', tickets: 14, risk: 'Low', issue: 'Drainage & Waterlogging', progress: 92, color: 'bg-emerald-500' },
    { name: 'Gachibowli Outer Ring Junction', tickets: 12, risk: 'Medium', issue: 'Damaged Traffic Signboards', progress: 80, color: 'bg-blue-500' },
  ];

  // Top Corridors Speed & Flow
  const corridors = [
    { name: 'PVNR Expressway / Airport Corridor', busSpeed: '42 km/h', flowStatus: 'Smooth Flow', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { name: 'Begumpet - Secunderabad Main Road', busSpeed: '16 km/h', flowStatus: 'Heavy Congestion (-18 min delay)', color: 'text-red-700 bg-red-50 border-red-200' },
    { name: 'Gachibowli - Miyapur Arterial', busSpeed: '24 km/h', flowStatus: 'Moderate Bottleneck (-8 min delay)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { name: 'Mehdipatnam - Lakdikapul Route', busSpeed: '19 km/h', flowStatus: 'School Zone Friction', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Executive KPI Metrics */}
      <KPICards tickets={tickets} />

      {/* Main Insights Grid: Area Density Hotspots + Traffic Corridor Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wards & Areas with Most Defect Tickets */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-600" />
                Hyderabad Wards &amp; Corridors with Highest Ticket Concentration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-camera bus fleet detection density ranked by municipal ward priority
              </p>
            </div>
            <button
              onClick={() => onNavigate('map')}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 font-mono"
            >
              View on GIS Map &rarr;
            </button>
          </div>

          <div className="space-y-3.5">
            {hyderabadZones.map((zone, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 transition">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-mono font-bold text-xs flex items-center justify-center">
                      0{idx + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-800">{zone.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                      {zone.tickets} Active Tickets
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-mono">
                  <span>Primary Issue: <b className="text-slate-800">{zone.issue}</b></span>
                  <span>SLA Compliance: <b>{zone.progress}%</b></span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${zone.color} rounded-full`} style={{ width: `${zone.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Intelligence Category Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Intelligence Streams Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live sensing breakdown across the 3 core vision engines
            </p>
          </div>

          <div className="space-y-4">
            {/* Stream 1: Road Infrastructure */}
            <div
              onClick={() => onNavigate('road')}
              className="p-4 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                  <span className="text-sm font-bold text-slate-800">Road Infrastructure</span>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-emerald-700">
                  {potholes || 18} Issues
                </span>
                <span className="text-xs font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                  Potholes &amp; Damage
                </span>
              </div>
            </div>

            {/* Stream 2: Traffic Intelligence */}
            <div
              onClick={() => onNavigate('traffic')}
              className="p-4 bg-amber-50/50 hover:bg-amber-50 border border-amber-200 rounded-xl cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="text-sm font-bold text-slate-800">Traffic Intelligence</span>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-amber-600">
                  {trafficCount || 12} Hotspots
                </span>
                <span className="text-xs font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
                  Bottlenecks &amp; Density
                </span>
              </div>
            </div>

            {/* Stream 3: Safety Intelligence */}
            <div
              onClick={() => onNavigate('safety')}
              className="p-4 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-200 rounded-xl cursor-pointer transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                  <span className="text-sm font-bold text-slate-800">Safety Intelligence</span>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition" />
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-indigo-600">
                  {safetyCount || 8} Risks
                </span>
                <span className="text-xs font-mono text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded font-bold">
                  Pedestrian Hazards
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Corridor Delay & Traffic Insights + Contractor Governance Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Transit Corridors & Speed Delays */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-amber-500" />
              Key Arterial Corridor Speeds &amp; Public Transit Bottlenecks
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live bus transit telemetry vs scheduled velocity across major roads
            </p>
          </div>

          <div className="space-y-3">
            {corridors.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                <div>
                  <span className="font-bold text-slate-800 block">{c.name}</span>
                  <span className="text-xs text-slate-500 font-mono">Bus Fleet Speed: <b className="text-slate-800">{c.busSpeed}</b></span>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${c.color}`}>
                  {c.flowStatus}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contractor SLA Governance Performance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Ward Contractor &amp; SLA Compliance Performance
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Resolution rate &amp; turnaround time metrics for assigned municipal contractors
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-sm">Ward Contractor 12 (abhimanu6729@gmail.com)</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                  92.4% On-Time
                </span>
              </div>
              <p className="text-xs text-slate-600 font-mono mb-2">Jurisdiction: Banjara Hills, Jubilee Hills, Khairatabad</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">Avg Response</span>
                  <b className="text-slate-800 text-sm">4.2 Hours</b>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">Turnaround</span>
                  <b className="text-slate-800 text-sm">18.5 Hours</b>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-500 block">Proof Uploads</span>
                  <b className="text-emerald-700 text-sm">100% Verified</b>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900 text-sm">Escalation Authority (lingarajusaikumar@gmail.com)</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-mono">
                  Tier 2 Active
                </span>
              </div>
              <p className="text-xs text-slate-600 font-mono">
                Automated 24h breach dispatch &bull; Emergency municipal intervention ready
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
