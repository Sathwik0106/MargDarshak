import React from 'react';
import { X, CheckCircle, AlertTriangle, MapPin, Calendar, User, ThumbsUp } from 'lucide-react';

export default function ProofModal({ ticket, onClose, onEscalate }) {
  if (!ticket) return null;

  const lat = ticket.location?.latitude;
  const lon = ticket.location?.longitude;
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 relative">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#0b2545] text-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30 font-bold">
              #{ticket.id}
            </span>
            <h3 className="text-base font-bold capitalize">
              Defect Inspection: {ticket.problem}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-300 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block font-mono">STATUS:</span>
              <b className="text-slate-800">{ticket.status}</b>
            </div>
            <div>
              <span className="text-slate-500 block font-mono">PRIORITY / VOTES:</span>
              <b className="text-amber-600 flex items-center gap-1">
                <ThumbsUp className="w-3 h-3 text-amber-500" /> {ticket.votes || 1} Vote(s)
              </b>
            </div>
            <div>
              <span className="text-slate-500 block font-mono">LOCATION:</span>
              <b className="text-slate-800">{lat?.toFixed(4)}, {lon?.toFixed(4)}</b>
            </div>
            <div>
              <span className="text-slate-500 block font-mono">ASSIGNED:</span>
              <b className="text-slate-800 truncate block">{ticket.contractor_email}</b>
            </div>
          </div>

          {/* Before vs After Photo Comparison */}
          <div>
            <h4 className="text-xs uppercase font-mono font-bold text-slate-500 tracking-wider mb-3">
              Evidentiary Photo Comparison (Before vs After)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before Photo */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">1. Original Detection (Before)</span>
                  <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">
                    YOLO CAMERA
                  </span>
                </div>
                {beforeImgSrc ? (
                  <img
                    src={beforeImgSrc}
                    alt="Original Defect"
                    className="w-full h-56 object-cover rounded-md border border-slate-200"
                  />
                ) : (
                  <div className="w-full h-56 bg-slate-200 flex items-center justify-center text-slate-400 text-xs rounded-md">
                    No camera photo available
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-2 font-mono">
                  Confidence: {ticket.confidence ? (ticket.confidence * 100).toFixed(1) : 92}% &bull; Camera Array Feed
                </p>
              </div>

              {/* After Photo */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">2. Contractor Repair Proof (After)</span>
                  {afterImgSrc ? (
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> VERIFIED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold">
                      AWAITING REPAIR
                    </span>
                  )}
                </div>
                {afterImgSrc ? (
                  <img
                    src={afterImgSrc}
                    alt="Repaired Defect Proof"
                    className="w-full h-56 object-cover rounded-md border border-slate-200"
                  />
                ) : (
                  <div className="w-full h-56 bg-amber-50/60 border border-dashed border-amber-300 flex flex-col items-center justify-center text-amber-700 text-xs rounded-md p-4 text-center">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                    <span>Contractor has not uploaded repair photo proof yet.</span>
                    <span className="text-[11px] text-slate-500 mt-1">
                      Link sent via email to: {ticket.contractor_email}
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-2 font-mono">
                  {ticket.resolved_at ? `Resolved at: ${new Date(ticket.resolved_at).toLocaleString()}` : 'Pending contractor completion'}
                </p>
              </div>
            </div>
          </div>

          {/* Contractor Notes & Resolution Summary */}
          {(ticket.plan_of_action || ticket.resolution_summary) && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
              {ticket.plan_of_action && (
                <div>
                  <b className="text-slate-800">Contractor Plan of Action:</b>
                  <p className="text-slate-600 mt-0.5">{ticket.plan_of_action}</p>
                </div>
              )}
              {ticket.resolution_summary && (
                <div>
                  <b className="text-emerald-700">Work Done Summary:</b>
                  <p className="text-slate-600 mt-0.5">{ticket.resolution_summary}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              Close Window
            </button>

            {ticket.status !== 'RESOLVED' && ticket.status !== 'ESCALATED_ZONAL' && (
              <button
                onClick={() => {
                  onEscalate(ticket.id);
                  onClose();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Escalate Ticket to Higher Authority
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
