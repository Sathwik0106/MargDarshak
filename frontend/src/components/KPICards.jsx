import React from 'react';
import { 
  AlertTriangle, CheckCircle2, Clock, 
  HardHat, FileText, ArrowUpRight 
} from 'lucide-react';

export default function KPICards({ tickets = [] }) {
  const totalTickets = tickets.length;
  const filedCount = tickets.filter(t => t.status === 'FILED').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'INTAKE_COMPLETED' || t.status === 'ASSIGNED_TO_CONTRACTOR').length;
  const escalatedCount = tickets.filter(t => t.status === 'ESCALATED_ZONAL').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Total Defects Logged */}
      <div className="gov-card p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="gov-card-label">Total Registered</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="gov-stat-value">{totalTickets}</div>
            <p className="text-xs text-slate-500 mt-1">Active Municipal Registry</p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>Intake Stage (T+3):</span>
          <span className="font-semibold text-blue-700 font-mono">
            {filedCount} Awaiting Intake
          </span>
        </div>
      </div>

      {/* 2. Work In Progress (T+3 to T+7) */}
      <div className="gov-card p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="gov-card-label">In Progress</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="gov-stat-value">{inProgressCount}</div>
            <p className="text-xs text-slate-500 mt-1">Day T+3 to T+7 Lifecycle</p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>Circle Engineers:</span>
          <span className="font-semibold text-slate-800 font-mono">
            199 GHMC Officers
          </span>
        </div>
      </div>

      {/* 3. Statutory T+7 SLA Critical Breaches */}
      <div className="gov-card p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="gov-card-label text-red-700">T+7 SLA Breaches</span>
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-700 flex items-center justify-center border border-red-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="gov-stat-value text-red-700">{escalatedCount}</div>
            <p className="text-xs text-red-600/80 mt-1">Escalated to Zonal Authority</p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>Executive Oversight:</span>
          <span className="font-semibold text-red-700 font-mono">
            Zonal Comm (IAS)
          </span>
        </div>
      </div>

      {/* 4. Resolved & Verified */}
      <div className="gov-card p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="gov-card-label">Resolved in SLA</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="gov-stat-value text-emerald-800">{resolvedCount}</div>
            <p className="text-xs text-slate-500 mt-1">Verified with Photo Proof</p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>Compliance:</span>
          <span className="font-semibold text-emerald-700 font-mono">
            {totalTickets > 0 ? Math.round((resolvedCount / totalTickets) * 100) : 100}% Closed
          </span>
        </div>
      </div>
    </div>
  );
}
