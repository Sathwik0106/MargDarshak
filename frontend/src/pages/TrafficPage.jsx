import React from 'react';
import { ArrowLeft, Car, TrendingUp, AlertCircle, Clock, Activity } from 'lucide-react';
import OpenStreetMap from '../components/OpenStreetMap';
import TicketTable from '../components/TicketTable';

export default function TrafficPage({ tickets, onBack, onSelectTicket, onEscalateTicket }) {
  const trafficTickets = tickets.filter((t) => {
    const p = (t.problem || '').toLowerCase();
    return ['traffic', 'vehicle', 'bottleneck', 'car', 'bus', 'truck', 'motorcycle', 'auto', 'bicycle', 'congestion'].some(k => p.includes(k));
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
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
              <span className="text-xs uppercase tracking-wider font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                AI Vision Engine 2
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              Traffic Flow &amp; Congestion Intelligence
            </h1>
            <p className="text-sm text-slate-600">
              Fleet-wide vehicle counting, flow velocity, bottleneck tracking &amp; route delay analytics
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block font-mono">
          <span className="text-xs text-slate-500 block uppercase">Active Traffic Alerts</span>
          <span className="text-3xl font-extrabold text-amber-600">{trafficTickets.length}</span>
        </div>
      </div>

      {/* Traffic Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono">Fleet Flow Velocity</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">22.4 km/h</div>
          <span className="text-xs text-emerald-600 font-semibold">&uarr; +3.2 km/h vs peak</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono">Congestion Index</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">68.2%</div>
          <span className="text-xs text-amber-600">Moderate Corridor Delay</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono">Identified Bottlenecks</span>
          <div className="text-2xl font-extrabold text-red-600 mt-1">{trafficTickets.length || 3}</div>
          <span className="text-xs text-slate-500">Key junction friction</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase font-mono">Vehicles Screened</span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">4,892</div>
          <span className="text-xs text-slate-500">Multi-class classification</span>
        </div>
      </div>

      {/* Traffic GIS Heatmap */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
        <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          Hyderabad Traffic Density &amp; Bottlenecks Map
        </h3>
        <OpenStreetMap tickets={trafficTickets} onSelectTicket={onSelectTicket} />
      </div>

      {/* Traffic Tickets Queue */}
      <TicketTable
        tickets={trafficTickets}
        totalCount={tickets.length}
        activeTab="traffic"
        setActiveTab={() => {}}
        onSelectTicket={onSelectTicket}
        onEscalateTicket={onEscalateTicket}
      />
    </div>
  );
}
