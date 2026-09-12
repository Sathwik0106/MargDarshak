import React from 'react';
import { 
  X, CheckCircle, AlertTriangle, MapPin, Calendar, 
  User, ThumbsUp, Clock, Phone, Mail, ExternalLink, ShieldCheck, ArrowRight
} from 'lucide-react';

export default function ProofModal({ ticket, onClose, onEscalate }) {
  if (!ticket) return null;

  const lat = ticket.location?.latitude;
  const lon = ticket.location?.longitude;
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;

  const getImgSrc = (imgProp, urlProp) => {
    if (urlProp) return urlProp;
    if (!imgProp) return null;
    if (imgProp.startsWith('http://') || imgProp.startsWith('https://') || imgProp.startsWith('/')) {
      return imgProp;
    }
    return `data:image/jpeg;base64,${imgProp}`;
  };

  const beforeImgSrc = getImgSrc(ticket.image_bytes, ticket.evidence_image_url);
  const afterImgSrc = getImgSrc(ticket.proof_image_bytes, ticket.proof_image_url);
  const hasProof = Boolean(afterImgSrc);
  const isResolved = ticket.status === 'RESOLVED';
  const isEscalated = ticket.status === 'ESCALATED_ZONAL';

  // SLA calculation for T+3, T+5, T+7 statutory schedule
  const now = Date.now() / 1000;
  let currentStage = 'Stage 1: T+3 Intake';
  let targetDeadline = ticket.sla_t3_intake_deadline || (ticket.created_timestamp ? ticket.created_timestamp + (72 * 3600) : 0);

  if (ticket.status === 'INTAKE_COMPLETED') {
    currentStage = 'Stage 2: T+5 Action Plan';
    targetDeadline = ticket.sla_t5_response_deadline || (ticket.created_timestamp ? ticket.created_timestamp + (120 * 3600) : 0);
  } else if (ticket.status === 'IN_PROGRESS' || ticket.status === 'ASSIGNED_TO_CONTRACTOR') {
    currentStage = 'Stage 3: T+7 Physical Repair';
    targetDeadline = ticket.sla_t7_resolution_deadline || ticket.sla_deadline_timestamp || (ticket.created_timestamp ? ticket.created_timestamp + (168 * 3600) : 0);
  } else if (ticket.status === 'RESOLVED') {
    currentStage = 'Final Stage: Verified in SLA';
  } else if (ticket.status === 'ESCALATED_ZONAL') {
    currentStage = 'Statutory Breach: Escalated to Zonal';
  }

  const remainingSec = targetDeadline > 0 ? Math.max(0, targetDeadline - now) : (ticket.sla_remaining_seconds || 0);
  const remainingDays = Math.floor(remainingSec / 86400);
  const remainingHours = Math.floor((remainingSec % 86400) / 3600);
  const remainingMins = Math.floor((remainingSec % 3600) / 60);

  // Formatted dates
  const createdDateStr = ticket.created_at || (ticket.created_timestamp ? new Date(ticket.created_timestamp * 1000).toLocaleString() : 'Filed');
  const t3DateStr = ticket.sla_t3_intake_deadline ? new Date(ticket.sla_t3_intake_deadline * 1000).toLocaleDateString() : 'T+3 (72h)';
  const t5DateStr = ticket.sla_t5_response_deadline ? new Date(ticket.sla_t5_response_deadline * 1000).toLocaleDateString() : 'T+5 (120h)';
  const t7DateStr = ticket.sla_t7_resolution_deadline ? new Date(ticket.sla_t7_resolution_deadline * 1000).toLocaleDateString() : 'T+7 (168h)';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* 1. Modal Top Bar with National Branding */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0a2540] text-amber-400 flex items-center justify-center font-bold text-sm shadow-sm">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                  Inspection ID: #{ticket.id}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  GHMC Road Division
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 capitalize leading-snug">
                {ticket.problem} &mdash; Defect Verification &amp; SLA Console
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Modal Body Grid */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Section: Side-by-Side Photo Comparison (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                  Visual Evidence Verification (Before vs After)
                </h4>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{lat ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : 'View GPS'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Before: AI Detected Photo */}
                <div className="gov-card p-3 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      1. AI Detected Defect
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      YOLO Fleet
                    </span>
                  </div>

                  <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 h-52 flex items-center justify-center">
                    {beforeImgSrc ? (
                      <>
                        <img
                          src={beforeImgSrc}
                          alt="AI Detected Road Defect"
                          className="w-full h-full object-cover"
                        />
                        {/* Detection Bounding Box Marker UI overlay */}
                        <div className="absolute inset-8 border-2 border-red-500 bg-red-500/15 rounded pointer-events-none flex items-start justify-start p-1">
                          <span className="text-[10px] bg-red-600 text-white font-mono px-1 rounded font-bold">
                            {ticket.problem} ({(ticket.confidence ? (ticket.confidence * 100).toFixed(0) : 88)}%)
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4 text-slate-400 text-xs">
                        <MapPin className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <span>Camera snapshot logged from Transit Bus Array</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-[11px] text-slate-500 space-y-0.5 font-mono">
                    <div className="flex justify-between">
                      <span>Logged:</span>
                      <span className="text-slate-800 font-bold">{createdDateStr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Conf:</span>
                      <span className="text-emerald-700 font-bold">
                        {(ticket.confidence ? (ticket.confidence * 100).toFixed(0) : 88)}% (Verified)
                      </span>
                    </div>
                  </div>
                </div>

                {/* After: Contractor Repaired Surface Photo */}
                <div className="gov-card p-3 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${hasProof ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      2. Contractor Repaired Surface
                    </span>
                    {hasProof ? (
                      <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" /> PROOF
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                        PENDING
                      </span>
                    )}
                  </div>

                  <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 h-52 flex items-center justify-center">
                    {afterImgSrc ? (
                      <img
                        src={afterImgSrc}
                        alt="Contractor Repaired Surface"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4 text-amber-800 text-xs bg-amber-50/60 h-full w-full flex flex-col items-center justify-center">
                        <Clock className="w-8 h-8 text-amber-500 mb-1.5" />
                        <span className="font-bold">Awaiting Repair Photo</span>
                        <span className="text-[11px] text-slate-500 mt-1 max-w-[180px]">
                          Contractor has received the SMS/Email dispatch link.
                        </span>
                        <a
                          href={`http://localhost:8000/contractor/resolve/${ticket.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 px-2.5 py-1 bg-white border border-amber-300 text-amber-900 rounded font-bold text-[11px] hover:bg-amber-100 transition shadow-sm"
                        >
                          Contractor Upload Portal &rarr;
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-[11px] text-slate-500 space-y-0.5 font-mono">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-bold text-slate-800">
                        {hasProof ? 'Work Completed' : 'In Progress'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Resolved At:</span>
                      <span className="text-slate-800 font-bold">
                        {ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleDateString() : 'Awaiting'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Done & Action Notes */}
              {(ticket.plan_of_action || ticket.resolution_summary) && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                  {ticket.plan_of_action && (
                    <div>
                      <span className="font-bold text-slate-800">Action Plan Submitted:</span>
                      <p className="text-slate-600 mt-0.5 bg-slate-50 p-2.5 rounded border border-slate-100">
                        {ticket.plan_of_action}
                      </p>
                    </div>
                  )}
                  {ticket.resolution_summary && (
                    <div>
                      <span className="font-bold text-emerald-800">Work Execution Summary:</span>
                      <p className="text-slate-600 mt-0.5 bg-emerald-50/50 p-2.5 rounded border border-emerald-100">
                        {ticket.resolution_summary}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Section: Stepper Timeline & SLA Accountability (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* 1. 4-Stage Lifecycle Stepper */}
              <div className="gov-card p-4 bg-white">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono mb-3.5">
                  Statutory Resolution Lifecycle (T+3, T+5, T+7)
                </h4>

                <div className="space-y-4">
                  {/* Step 1: Day T */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-slate-900">1. Day T: Defect Filed &amp; Registered</div>
                      <div className="text-slate-500 font-mono text-[11px]">{createdDateStr}</div>
                    </div>
                  </div>

                  {/* Step 2: Day T+3 */}
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full ${ticket.status !== 'FILED' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white animate-pulse'} flex items-center justify-center shrink-0 mt-0.5`}>
                      {ticket.status !== 'FILED' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-slate-900">2. Day T+3: Municipal Intake (0-72h)</div>
                      <div className="text-slate-600 text-[11px]">
                        Officer: <b>{ticket.assigned_officer_name || 'Circle Executive Engineer'}</b>
                      </div>
                      <div className="text-slate-400 font-mono text-[10px]">
                        {ticket.status !== 'FILED' ? 'Intake Completed & Site Validated' : `Pending intake (Deadline: ${t3DateStr})`}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Day T+5 */}
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full ${hasProof || ticket.plan_of_action || ticket.status === 'IN_PROGRESS' || isResolved ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'} flex items-center justify-center shrink-0 mt-0.5`}>
                      {hasProof || ticket.plan_of_action || isResolved ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-slate-900">3. Day T+5: Response &amp; Action Plan (72-120h)</div>
                      <div className="text-slate-600 text-[11px]">
                        {ticket.plan_of_action ? 'Action Plan Formulated & Dispatched' : 'Work estimate & equipment mobilized'}
                      </div>
                      <div className="text-slate-400 font-mono text-[10px]">
                        Target Response: {t5DateStr}
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Day T+7 */}
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full ${isResolved ? 'bg-emerald-600 text-white' : isEscalated ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'} flex items-center justify-center shrink-0 mt-0.5`}>
                      {isResolved ? <CheckCircle className="w-3.5 h-3.5" /> : isEscalated ? <AlertTriangle className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold">4</span>}
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-slate-900">4. Day T+7: Final Resolution (120-168h)</div>
                      <div className="text-slate-600 text-[11px]">
                        {isResolved ? 'Resurfaced & Closed within SLA' : isEscalated ? 'Statutory Breach -> Escalated to Zonal Commissioner' : 'Surface paving & compaction in progress'}
                      </div>
                      <div className="text-slate-400 font-mono text-[10px]">
                        Final Statutory Limit: {t7DateStr}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SLA Countdown Dial Card */}
              <div className={`gov-card p-4 ${isEscalated ? 'border-red-300 bg-red-50/40' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                    Statutory T+7 SLA Clock
                  </span>
                  {isEscalated ? (
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-red-600 text-white">
                      T+7 BREACHED
                    </span>
                  ) : isResolved ? (
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-600 text-white">
                      MET IN SLA
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                      {currentStage.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 my-2">
                  <div className="w-14 h-14 rounded-full border-4 border-blue-600/30 border-t-blue-600 flex items-center justify-center shrink-0 font-mono font-extrabold text-xs text-slate-900 text-center">
                    {remainingDays > 0 ? `${remainingDays}d` : `${remainingHours}h`}
                  </div>
                  <div>
                    <div className="text-base font-extrabold text-slate-900 font-mono">
                      {remainingDays > 0 ? `${remainingDays}d ` : ''}{remainingHours}h {remainingMins}m left
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Statutory Resolution Limit: <b>{t7DateStr}</b>
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Municipal Officer & Zonal Accountability Card */}
              <div className="gov-card p-4 bg-white text-xs space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono block">
                  Municipal Officer Accountability
                </span>
                <div className="space-y-1.5 font-medium">
                  <div className="flex items-center gap-2 text-slate-800">
                    <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span><b>Circle EE:</b> {ticket.assigned_officer_name || 'G. Anjaneyulu (EE)'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span><b>Ward / Zone:</b> {ticket.assigned_circle || 'Circle 12'} &bull; {ticket.assigned_zone || 'Central Zone'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono truncate">{ticket.assigned_officer_email || ticket.contractor_email || 'ee-circle12@ghmc.gov.in'}</span>
                  </div>
                  {ticket.assigned_officer_phone && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{ticket.assigned_officer_phone}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Higher Authority (T+7 Escalation)</span>
                      <span className="font-bold text-slate-800 text-[11px]">{ticket.escalation_officer_name || 'Sri Mayank Singh IAS (Zonal Commissioner)'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Action Buttons */}
              <div className="space-y-2 pt-2">
                <a
                  href={`http://localhost:8000/contractor/resolve/${ticket.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Accept Repair &amp; Close Defect</span>
                </a>

                {ticket.status !== 'RESOLVED' && ticket.status !== 'ESCALATED_ZONAL' && (
                  <button
                    onClick={() => {
                      onEscalate(ticket.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs transition"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Request Re-Inspection / Escalate SLA</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
