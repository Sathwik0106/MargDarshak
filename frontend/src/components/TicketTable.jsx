import React, { useState } from 'react';
import { 
  Eye, AlertTriangle, CheckCircle, ExternalLink, 
  ThumbsUp, Clock, Search, ShieldAlert, Image as ImageIcon,
  ChevronRight, MoreHorizontal
} from 'lucide-react';

export default function TicketTable({ 
  tickets = [], 
  totalCount, 
  activeTab, 
  setActiveTab, 
  onSelectTicket, 
  onEscalateTicket,
  onVote 
}) {
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Unified Status and SLA countdown chip renderer
  const renderUnifiedStatusAndSla = (ticket) => {
    if (ticket.status === 'RESOLVED') {
      return (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" /> Resolved
          </span>
          <div className="text-[11px] text-slate-500 font-mono">Met in SLA</div>
        </div>
      );
    }

    if (ticket.status === 'ESCALATED_ZONAL') {
      return (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3 h-3 text-red-600" /> T+7 Breached
          </span>
          <div className="text-[11px] text-red-600 font-semibold font-mono">Zonal Escalation</div>
        </div>
      );
    }

    const now = Date.now() / 1000;
    let targetDeadline = 0;
    let stagePrefix = 'T+7 Fix:';
    let statusLabel = 'In Progress';
    let statusColor = 'bg-amber-50 text-amber-800 border-amber-200';

    if (ticket.status === 'FILED') {
      statusLabel = 'Filed (Intake)';
      statusColor = 'bg-blue-50 text-blue-800 border-blue-200';
      stagePrefix = 'T+3:';
      targetDeadline = ticket.sla_t3_intake_deadline || (ticket.created_timestamp ? ticket.created_timestamp + (72 * 3600) : 0);
    } else if (ticket.status === 'INTAKE_COMPLETED') {
      statusLabel = 'Intake Done';
      statusColor = 'bg-slate-100 text-slate-800 border-slate-200';
      stagePrefix = 'T+5:';
      targetDeadline = ticket.sla_t5_response_deadline || (ticket.created_timestamp ? ticket.created_timestamp + (120 * 3600) : 0);
    } else {
      statusLabel = 'In Progress';
      statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
      stagePrefix = 'T+7:';
      targetDeadline = ticket.sla_t7_resolution_deadline || ticket.sla_deadline_timestamp || (ticket.created_timestamp ? ticket.created_timestamp + (168 * 3600) : 0);
    }

    const remainingSec = targetDeadline > 0 
      ? Math.max(0, targetDeadline - now) 
      : (ticket.sla_remaining_seconds || 0);

    const days = Math.floor(remainingSec / 86400);
    const hours = Math.floor((remainingSec % 86400) / 3600);
    const minutes = Math.floor((remainingSec % 3600) / 60);

    const timeDisplay = remainingSec <= 0 
      ? 'Stage Expired' 
      : days > 0 ? `${days}d ${hours}h left` : `${hours}h ${minutes}m left`;

    return (
      <div className="space-y-1">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${statusColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${ticket.status === 'FILED' ? 'bg-blue-600 animate-pulse' : ticket.status === 'IN_PROGRESS' ? 'bg-amber-600' : 'bg-slate-600'}`}></span>
          {statusLabel}
        </span>
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{stagePrefix} {timeDisplay}</span>
        </div>
      </div>
    );
  };

  const getCategoryTitle = () => {
    switch (activeTab) {
      case 'road':
        return 'Road Infrastructure Defect Registry';
      case 'traffic':
        return 'Traffic Flow & Bottleneck Registry';
      case 'safety':
        return 'Safety Hazard & Pedestrian Registry';
      case 'sla':
        return 'Critical Statutory SLA Escalation Queue';
      default:
        return 'Municipal Grievance & Defect Registry';
    }
  };

  // Filter tickets by search and status
  const filteredTickets = tickets.filter(ticket => {
    const q = tableSearch.toLowerCase().trim();
    const matchesSearch = !q || 
      (ticket.id && ticket.id.toLowerCase().includes(q)) ||
      (ticket.problem && ticket.problem.toLowerCase().includes(q)) ||
      (ticket.assigned_officer_name && ticket.assigned_officer_name.toLowerCase().includes(q)) ||
      (ticket.assigned_officer_email && ticket.assigned_officer_email.toLowerCase().includes(q)) ||
      (ticket.assigned_circle && ticket.assigned_circle.toLowerCase().includes(q)) ||
      (ticket.contractor_email && ticket.contractor_email.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="gov-card overflow-hidden">
      {/* 1. Header with Category Title & Summary */}
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="gov-section-header">
              {getCategoryTitle()}
            </h2>
            <span className="text-xs bg-slate-200 text-slate-700 font-mono font-semibold px-2 py-0.5 rounded-full">
              {filteredTickets.length} of {totalCount || tickets.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Public grievance and automated transit fleet inspection logs &bull; T+3, T+5, T+7 statutory schedule
          </p>
        </div>
      </div>

      {/* 2. Search & Status Filter Toolbar */}
      <div className="px-6 py-3.5 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, Defect, Officer, Ward..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-medium focus:bg-white focus:border-blue-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="FILED">Filed (Day T to T+3: Intake)</option>
            <option value="INTAKE_COMPLETED">Intake Done (Day T+3 to T+5: Plan)</option>
            <option value="IN_PROGRESS">In Progress (Day T+5 to T+7: Fix)</option>
            <option value="RESOLVED">Resolved &amp; Verified</option>
            <option value="ESCALATED_ZONAL">Escalated to Zonal (&gt;T+7)</option>
          </select>
        </div>
      </div>

      {/* 3. Responsive Data Table for Desktop & Tablet */}
      <div className="hidden md:block overflow-x-auto">
        <table className="gov-table w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="sticky-col py-3 px-4 w-28">Ticket ID</th>
              <th className="py-3 px-4 min-w-[220px]">Defect Classification</th>
              <th className="py-3 px-4 min-w-[180px]">Ward &amp; Coordinates</th>
              <th className="py-3 px-4 min-w-[180px]">Status &amp; SLA Stage</th>
              <th className="py-3 px-4 min-w-[200px]">Assigned Municipal Officer</th>
              <th className="py-3 px-4 text-right min-w-[100px]">Community Priority</th>
              <th className="py-3 px-4 text-right min-w-[140px]">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs divide-y divide-slate-100">
            {filteredTickets.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-500 font-medium">
                  No municipal defects match the filter criteria.
                </td>
              </tr>
            ) : (
              filteredTickets.map((ticket) => {
                const lat = ticket.location?.latitude;
                const lon = ticket.location?.longitude;
                const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;
                const hasProof = Boolean(ticket.proof_image_filename || ticket.proof_image_url || ticket.proof_image_bytes);

                return (
                  <tr key={ticket.id} className="transition">
                    {/* Frozen Sticky Ticket ID */}
                    <td className="sticky-col py-3.5 px-4 font-mono font-bold text-slate-900 bg-white">
                      #{ticket.id}
                    </td>

                    {/* Defect Classification & Verification */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 capitalize text-xs sm:text-sm">
                        {ticket.problem}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-400 font-mono">
                          Conf: {ticket.confidence ? (ticket.confidence * 100).toFixed(0) : 88}%
                        </span>
                        {hasProof ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Photo Uploaded
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">
                            Pending Proof
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Ward / Coordinates */}
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      <div className="font-semibold text-slate-800 text-xs font-sans">
                        {ticket.assigned_circle || 'Circle 12'} &bull; {ticket.assigned_zone || 'Central Zone'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span>{lat ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : 'Hyderabad Central'}</span>
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title="View coordinates on Google Maps"
                        >
                          <ExternalLink className="w-3 h-3 inline" />
                        </a>
                      </div>
                    </td>

                    {/* Unified Status & SLA Stage */}
                    <td className="py-3.5 px-4">
                      {renderUnifiedStatusAndSla(ticket)}
                    </td>

                    {/* Assigned Municipal Officer */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="font-semibold text-slate-800 truncate text-xs" title={ticket.assigned_officer_name}>
                        {ticket.assigned_officer_name || 'G. Anjaneyulu (EE)'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5" title={ticket.assigned_officer_email || ticket.contractor_email}>
                        {ticket.assigned_officer_email || ticket.contractor_email || 'ee-circle12@ghmc.gov.in'}
                      </div>
                      {ticket.assigned_officer_phone && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          Ph: {ticket.assigned_officer_phone}
                        </div>
                      )}
                    </td>

                    {/* Community Priority (Right-aligned numeric) */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onVote && onVote(ticket.id)}
                        title="Upvote community priority"
                        className="inline-flex items-center gap-1.5 font-semibold font-mono px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs transition active:scale-95"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-blue-700" />
                        <span>{ticket.votes || 1}</span>
                      </button>
                    </td>

                    {/* Compact Action Group */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => onSelectTicket(ticket)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#0a2540] hover:bg-[#153e6b] text-white rounded font-semibold text-xs transition shadow-sm"
                          title="Inspect defect details and proof"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>

                        {ticket.status !== 'RESOLVED' && ticket.status !== 'ESCALATED_ZONAL' && (
                          <button
                            onClick={() => onEscalateTicket(ticket.id)}
                            className="p-1.5 text-red-700 hover:bg-red-50 border border-red-200 rounded transition"
                            title="Escalate SLA breach to Higher Authority"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Responsive Card Layout for Small Screens (< md) */}
      <div className="block md:hidden divide-y divide-slate-200">
        {filteredTickets.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            No issues match the selected filter.
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div key={ticket.id} className="p-4 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 text-xs">
                  #{ticket.id}
                </span>
                <button
                  type="button"
                  onClick={() => onVote && onVote(ticket.id)}
                  className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800"
                >
                  <ThumbsUp className="w-3 h-3 text-blue-700" />
                  <span>{ticket.votes || 1}</span>
                </button>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 text-sm capitalize">{ticket.problem}</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {ticket.assigned_circle || 'Circle 12'} &bull; {ticket.assigned_officer_name || 'Circle EE'}
                </p>
              </div>

              <div className="pt-1">
                {renderUnifiedStatusAndSla(ticket)}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  onClick={() => onSelectTicket(ticket)}
                  className="px-3 py-1.5 bg-[#0a2540] text-white text-xs font-semibold rounded"
                >
                  Inspect Defect
                </button>
                {ticket.status !== 'RESOLVED' && ticket.status !== 'ESCALATED_ZONAL' && (
                  <button
                    onClick={() => onEscalateTicket(ticket.id)}
                    className="px-3 py-1.5 text-red-700 border border-red-200 text-xs font-semibold rounded"
                  >
                    Escalate SLA
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
