import React from 'react';
import { Eye, AlertTriangle, CheckCircle, ExternalLink, ThumbsUp, Filter } from 'lucide-react';

export default function TicketTable({ tickets, totalCount, activeTab, setActiveTab, onSelectTicket, onEscalateTicket }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ESCALATED_ZONAL':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-700 border border-red-300 flex items-center gap-1.5 w-fit">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> ESCALATED (ZONAL)
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 w-fit">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> RESOLVED &amp; PROVEN
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 w-fit">
            IN PROGRESS
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5 w-fit">
            ASSIGNED TO WARD
          </span>
        );
    }
  };

  const getCategoryTitle = () => {
    switch (activeTab) {
      case 'road':
        return 'Road Infrastructure Defect Queue';
      case 'traffic':
        return 'Traffic Intelligence & Flow Bottlenecks';
      case 'safety':
        return 'Safety Intelligence & Pedestrian Hazards';
      case 'sla':
        return 'Critical Escalated SLA Violations';
      default:
        return 'Active Master Tickets & Governance Queue';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-5">
      {/* Table Header with Category Switcher Tabs */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
            {getCategoryTitle()}
            <span className="text-xs bg-slate-200 text-slate-800 font-mono font-bold px-2.5 py-0.5 rounded-full">
              {tickets.length} of {totalCount} tickets
            </span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Filtered view: Showing problems specific to this intelligence category
          </p>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-3 py-1.5 rounded-md transition font-semibold ${
              activeTab === 'workspace' || activeTab === 'tickets'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Tickets
          </button>
          <button
            onClick={() => setActiveTab('road')}
            className={`px-3 py-1.5 rounded-md transition font-semibold ${
              activeTab === 'road'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Road Infra
          </button>
          <button
            onClick={() => setActiveTab('traffic')}
            className={`px-3 py-1.5 rounded-md transition font-semibold ${
              activeTab === 'traffic'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            Traffic
          </button>
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-3 py-1.5 rounded-md transition font-semibold ${
              activeTab === 'safety'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-indigo-700'
            }`}
          >
            Safety
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-mono uppercase text-xs">
              <th className="py-3 px-4 font-bold">Ticket ID</th>
              <th className="py-3 px-4 font-bold">Defect / Issue</th>
              <th className="py-3 px-4 font-bold">Priority / Votes</th>
              <th className="py-3 px-4 font-bold">GPS Location</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 font-bold">Assigned Contractor</th>
              <th className="py-3 px-4 font-bold">Proof Status</th>
              <th className="py-3 px-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-500 font-medium text-sm">
                  No {activeTab !== 'workspace' ? activeTab.toUpperCase() : ''} issues recorded yet.
                  <span className="block text-xs text-slate-400 mt-1">
                    Upload a video or photo to run YOLO26m analysis for this category!
                  </span>
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
                const lat = ticket.location?.latitude;
                const lon = ticket.location?.longitude;
                const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
                const hasProof = Boolean(ticket.proof_image_bytes);

                return (
                  <tr key={ticket.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      #{ticket.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 capitalize text-sm">
                        {ticket.problem}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 font-bold font-mono px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs">
                        <ThumbsUp className="w-3.5 h-3.5 text-amber-600" />
                        {ticket.votes || 1} Vote(s)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 text-xs">
                      {lat ? `${lat.toFixed(5)}, ${lon.toFixed(5)}` : 'N/A'}{' '}
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 inline-block ml-1 font-bold"
                        title="View on Google Maps"
                      >
                        <ExternalLink className="w-3.5 h-3.5 inline" />
                      </a>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(ticket.status)}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 text-xs truncate max-w-[160px]">
                      {ticket.contractor_email || 'abhimanu6729@gmail.com'}
                    </td>
                    <td className="py-3.5 px-4">
                      {hasProof ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-xs">
                          <CheckCircle className="w-4 h-4 text-emerald-600" /> Photo Uploaded
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Pending Repair</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => onSelectTicket(ticket)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-semibold text-xs transition shadow-sm"
                        title="View Before vs After Evidence"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>

                      {ticket.status !== 'RESOLVED' && ticket.status !== 'ESCALATED_ZONAL' && (
                        <button
                          onClick={() => onEscalateTicket(ticket.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-md font-bold text-xs transition"
                          title="Trigger SLA Escalation Email to Higher Authority"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          Escalate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
