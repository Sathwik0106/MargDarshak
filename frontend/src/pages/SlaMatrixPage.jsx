import React from 'react';
import { ArrowLeft, ShieldAlert, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import TicketTable from '../components/TicketTable';

export default function SlaMatrixPage({ tickets = [], onBack, onSelectTicket, onEscalateTicket, onVote }) {
  const escalatedTickets = tickets.filter(t => t.status === 'ESCALATED_ZONAL');

  return (
    <div className="space-y-8 pb-8">
      {/* 1. Top Banner */}
      <div className="gov-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            title="Return to Command Workspace"
            aria-label="Return to Command Workspace"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="gov-card-label text-red-700">Governance Framework</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
              Statutory SLA Escalation Matrix (T+3, T+5, T+7)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Multi-tiered administrative protocol from Day T public registration through T+7 executive intervention
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right font-mono bg-red-50/60 border border-red-200/80 p-3 sm:p-4 rounded-xl shrink-0">
          <span className="text-[11px] text-red-700 block uppercase font-semibold">T+7 Statutory Breaches</span>
          <span className="gov-stat-value text-red-700 block mt-0.5">{escalatedTickets.length}</span>
        </div>
      </div>

      {/* 2. Visual Statutory Escalation Ladder */}
      <div className="gov-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-6">
          <div>
            <h3 className="gov-section-header text-base">
              Statutory Resolution Ladder Protocol
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mandatory GHMC Urban Engineering Standard &bull; Enforced by Municipal Zonal Commissioners
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
            Statutory Limit: 168h (7 Days)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 1: T+3 Intake */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="gov-card-label text-blue-800">
                  Tier 1: Intake
                </span>
                <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  0 &ndash; 72 Hours
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900">Circle Deputy Commissioner</h4>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Field Inspection &amp; Grievance Validation
              </p>

              <div className="mt-4 text-xs text-slate-700 bg-white p-3.5 rounded-lg border border-slate-200/70 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
                  <span>Status:</span>
                  <span className="bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.2 rounded font-mono text-[11px]">FILED</span>
                  <span>&rarr;</span>
                  <span className="bg-slate-100 text-slate-800 border border-slate-200 px-1.5 py-0.2 rounded font-mono text-[11px]">INTAKE_DONE</span>
                </div>
                <p className="text-slate-600 text-[11px]">&bull; Fleet vision detection or citizen report filed at Day T.</p>
                <p className="text-slate-600 text-[11px]">&bull; Mandatory on-site verification logged within 72 hours.</p>
              </div>
            </div>
          </div>

          {/* Tier 2: T+5 Action Plan */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="gov-card-label text-amber-800">
                  Tier 2: Action Plan
                </span>
                <span className="text-xs font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  72 &ndash; 120 Hours
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900">Executive Engineer (Circle Div)</h4>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Engineering Maintenance &amp; Bitumen Dispatch
              </p>

              <div className="mt-4 text-xs text-slate-700 bg-white p-3.5 rounded-lg border border-slate-200/70 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
                  <span>Status:</span>
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-mono text-[11px]">IN_PROGRESS</span>
                </div>
                <p className="text-slate-600 text-[11px]">&bull; Responsible engineer submits formal work execution plan.</p>
                <p className="text-slate-600 text-[11px]">&bull; Bitumen, compaction machinery, and road crew mobilized.</p>
              </div>
            </div>
          </div>

          {/* Tier 3: T+7 Resolution & Escalation */}
          <div className="bg-slate-50/70 border border-red-200/80 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="gov-card-label text-red-700">
                  Tier 3: Closure / Escalation
                </span>
                <span className="text-xs font-mono font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                  120 &ndash; 168 Hours
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900">Zonal Commissioner (IAS)</h4>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Administrative &amp; Judicial Sanction Authority
              </p>

              <div className="mt-4 text-xs text-slate-700 bg-white p-3.5 rounded-lg border border-red-200/60 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs">
                  <span>Target:</span>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-mono text-[11px]">RESOLVED</span>
                </div>
                <p className="text-red-700 font-medium text-[11px]">&bull; If unaddressed by T+7 (&gt;168h): Automatically escalates to Zonal Commissioner.</p>
                <p className="text-slate-600 text-[11px]">&bull; Immediate penalty assessment &amp; emergency flying squad intervention.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Escalated Tickets Queue */}
      <div className="space-y-4">
        <div>
          <h3 className="gov-section-header flex items-center gap-2 text-red-700">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            Statutory Escalation Queue ({escalatedTickets.length} Breaches)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Defects exceeding the 168-hour statutory resolution ceiling requiring direct Zonal Commissioner intervention
          </p>
        </div>

        <TicketTable
          tickets={escalatedTickets}
          totalCount={tickets.length}
          activeTab="sla"
          setActiveTab={() => {}}
          onSelectTicket={onSelectTicket}
          onEscalateTicket={onEscalateTicket}
          onVote={onVote}
        />
      </div>
    </div>
  );
}
