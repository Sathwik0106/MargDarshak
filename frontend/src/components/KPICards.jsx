import React from 'react';
import { AlertTriangle, TrendingUp, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

export default function KPICards({ tickets }) {
  const totalTickets = tickets.length;
  const escalatedCount = tickets.filter(t => t.status === 'ESCALATED_ZONAL').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED_TO_CONTRACTOR').length;
  const totalVotes = tickets.reduce((acc, curr) => acc + (curr.votes || 1), 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-5">
      {/* Total Active Tickets */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Master Tickets</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">LIVE</span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900">{totalTickets}</span>
          <span className="text-sm font-semibold text-slate-500">tickets logged</span>
        </div>
        <div className="mt-1.5 text-xs text-slate-600 font-mono">
          Priority Total: <b className="text-blue-700 text-sm font-bold">{totalVotes} Votes</b>
        </div>
      </div>

      {/* SLA Violations / Escalations */}
      <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm bg-red-50/30 hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-red-700 uppercase tracking-wider font-mono">SLA Breached</span>
          <ShieldAlert className="w-5 h-5 text-red-600" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-red-600">{escalatedCount}</span>
          <span className="text-sm font-semibold text-red-600">Zonal Level</span>
        </div>
        <div className="mt-1.5 text-xs text-red-700 font-mono font-semibold">
          Alerted: lingarajusaikumar
        </div>
      </div>

      {/* In Progress / Active Assigned */}
      <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider font-mono">In Progress</span>
          <Clock className="w-5 h-5 text-amber-500" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-amber-600">{inProgressCount}</span>
          <span className="text-sm font-semibold text-slate-500">active repair</span>
        </div>
        <div className="mt-1.5 text-xs text-slate-600 font-mono font-medium">
          Assigned: abhimanu6729
        </div>
      </div>

      {/* Resolved with Proof */}
      <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/30 hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-mono">Resolved</span>
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-emerald-700">{resolvedCount}</span>
          <span className="text-sm font-semibold text-emerald-700">verified</span>
        </div>
        <div className="mt-1.5 text-xs text-emerald-800 font-mono font-bold">
          Photo Proofs Attached
        </div>
      </div>

      {/* Spatial Proximity Metric */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 lg:col-span-1 hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Spatial Dedup</span>
          <TrendingUp className="w-5 h-5 text-slate-400" />
        </div>
        <div className="mt-2.5 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-800">7.0m</span>
          <span className="text-sm font-semibold text-slate-500">Haversine</span>
        </div>
        <div className="mt-1.5 text-xs text-slate-600 font-mono font-bold text-emerald-700">
          Zero Duplicate Tickets
        </div>
      </div>
    </div>
  );
}
