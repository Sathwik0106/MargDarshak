import React, { useState } from 'react';
import { 
  Search, CheckCircle2, Clock, AlertTriangle, 
  ThumbsUp, MapPin, Eye, ArrowRight, 
  ShieldCheck, HardHat, Car, ShieldAlert, Sparkles 
} from 'lucide-react';

export default function CitizenWorkspace({ 
  tickets = [], 
  onNavigate, 
  onSelectTicket, 
  onVote 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const getCategory = (t) => {
    const p = (t.problem || '').toLowerCase();
    if (['traffic', 'vehicle', 'bottleneck', 'car', 'bus', 'truck', 'motorcycle', 'auto', 'bicycle', 'congestion'].some(k => p.includes(k))) return 'traffic';
    if (['pedestrian', 'school', 'children', 'crossing', 'rash', 'hit_and_run', 'person', 'safety', 'conflict'].some(k => p.includes(k))) return 'safety';
    return 'road';
  };

  const roadTickets = tickets.filter(t => getCategory(t) === 'road');
  const trafficTickets = tickets.filter(t => getCategory(t) === 'traffic');
  const safetyTickets = tickets.filter(t => getCategory(t) === 'safety');

  const roadResolved = roadTickets.filter(t => t.status === 'RESOLVED').length;
  const trafficResolved = trafficTickets.filter(t => t.status === 'RESOLVED').length;
  const safetyResolved = safetyTickets.filter(t => t.status === 'RESOLVED').length;

  const totalResolved = tickets.filter(t => t.status === 'RESOLVED').length;
  const totalVotes = tickets.reduce((sum, t) => sum + (t.votes || 1), 0);

  // Filtered tickets based on search and category
  const filteredTickets = tickets.filter(t => {
    const matchesCategory = categoryFilter === 'ALL' || getCategory(t) === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q ||
      (t.id && t.id.toLowerCase().includes(q)) ||
      (t.problem && t.problem.toLowerCase().includes(q)) ||
      (t.contractor_email && t.contractor_email.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Resolved &amp; Verified
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Repair In Progress
          </span>
        );
      case 'ESCALATED_ZONAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> SLA Breached (Zonal Action)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" /> Assigned to Contractor
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* 1. Hero Banner: Citizen Transparency & Status Tracker */}
      <div className="bg-gradient-to-r from-[#0a2540] via-[#103459] to-[#154677] text-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-800 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>GHMC Public Infrastructure Transparency Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Track Road Repairs &amp; Community Priorities in Real Time
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Every reported defect is tracked with GPS verification, contractor accountability, and before-and-after photo proof. Upvote issues in your area to raise municipal repair priority.
          </p>

          {/* Quick Search / Track Box */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Track by Ticket ID (e.g. TICK-1001) or enter your Ward / Landmark..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/95 text-slate-900 placeholder-slate-500 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md transition"
              />
            </div>
          </div>
        </div>

        {/* Quick summary stats bar */}
        <div className="mt-8 pt-6 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
          <div>
            <span className="text-xs text-slate-400 block">Total Public Defects</span>
            <span className="text-2xl font-extrabold text-white">{tickets.length} Logged</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Fixed &amp; Verified</span>
            <span className="text-2xl font-extrabold text-emerald-400">{totalResolved} Repaired</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Citizen Endorsements</span>
            <span className="text-2xl font-extrabold text-amber-300">{totalVotes} Upvotes</span>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Municipal SLA Standard</span>
            <span className="text-2xl font-extrabold text-blue-300">48-Hour Guarantee</span>
          </div>
        </div>
      </div>

      {/* 2. THE 3 STREAM CARDS (Road Infra, Traffic, Safety) - Visible in Citizen Page */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              City Infrastructure Health &amp; Category Progress
            </h2>
            <p className="text-xs text-slate-500">
              Real-time sensing and repair status across the three municipal service divisions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Road Infrastructure */}
          <div 
            onClick={() => onNavigate('road')}
            className="gov-card p-6 bg-white hover:border-emerald-300 cursor-pointer group relative transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <HardHat className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {roadResolved} / {roadTickets.length} Fixed
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                Road Infrastructure
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Potholes, surface subsidence, asphalt cracks &amp; waterlogging
              </p>
            </div>

            <div className="mt-4 flex items-baseline justify-between pt-3 border-t border-slate-100">
              <span className="text-3xl font-extrabold text-emerald-700">
                {roadTickets.length} <span className="text-xs font-semibold text-slate-500 font-sans">Active Issues</span>
              </span>
              <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition flex items-center gap-1">
                View All &rarr;
              </span>
            </div>
          </div>

          {/* Card 2: Traffic Flow & Congestion */}
          <div 
            onClick={() => onNavigate('traffic')}
            className="gov-card p-6 bg-white hover:border-amber-300 cursor-pointer group relative transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Car className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {trafficResolved} / {trafficTickets.length} Cleared
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition">
                Traffic Flow &amp; Congestion
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choke points, arterial bottlenecks &amp; signal desynchronization
              </p>
            </div>

            <div className="mt-4 flex items-baseline justify-between pt-3 border-t border-slate-100">
              <span className="text-3xl font-extrabold text-amber-600">
                {trafficTickets.length} <span className="text-xs font-semibold text-slate-500 font-sans">Hotspots</span>
              </span>
              <span className="text-xs font-bold text-amber-600 group-hover:translate-x-1 transition flex items-center gap-1">
                View All &rarr;
              </span>
            </div>
          </div>

          {/* Card 3: Pedestrian & Safety */}
          <div 
            onClick={() => onNavigate('safety')}
            className="gov-card p-6 bg-white hover:border-indigo-300 cursor-pointer group relative transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                {safetyResolved} / {safetyTickets.length} Secured
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition">
                Pedestrian &amp; Safety
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                School crossings, missing zebras, blind spots &amp; roadside trenches
              </p>
            </div>

            <div className="mt-4 flex items-baseline justify-between pt-3 border-t border-slate-100">
              <span className="text-3xl font-extrabold text-indigo-600">
                {safetyTickets.length} <span className="text-xs font-semibold text-slate-500 font-sans">Risks</span>
              </span>
              <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition flex items-center gap-1">
                View All &rarr;
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PUBLIC GRIEVANCE FEED & DEFECT CARDS (Clean, Airy & Non-Congested) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Public Grievance Registry &amp; Citizen Tracking
            </h2>
            <p className="text-xs text-slate-500">
              Track repair progress, inspect contractor photo proof, or upvote to raise municipal priority
            </p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${categoryFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All ({tickets.length})
            </button>
            <button
              onClick={() => setCategoryFilter('road')}
              className={`px-3 py-1.5 rounded-lg transition ${categoryFilter === 'road' ? 'bg-white text-emerald-800 shadow-sm font-bold' : 'text-slate-600 hover:text-emerald-700'}`}
            >
              Roads ({roadTickets.length})
            </button>
            <button
              onClick={() => setCategoryFilter('traffic')}
              className={`px-3 py-1.5 rounded-lg transition ${categoryFilter === 'traffic' ? 'bg-white text-amber-800 shadow-sm font-bold' : 'text-slate-600 hover:text-amber-700'}`}
            >
              Traffic ({trafficTickets.length})
            </button>
            <button
              onClick={() => setCategoryFilter('safety')}
              className={`px-3 py-1.5 rounded-lg transition ${categoryFilter === 'safety' ? 'bg-white text-indigo-800 shadow-sm font-bold' : 'text-slate-600 hover:text-indigo-700'}`}
            >
              Safety ({safetyTickets.length})
            </button>
          </div>
        </div>

        {/* The Grid of Transparent Defect Cards */}
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 space-y-2">
            <p className="text-base font-bold text-slate-800">No public grievances match your search.</p>
            <p className="text-xs text-slate-400">Try searching a different keyword or ticket ID.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTickets.map((ticket) => {
              const lat = ticket.location?.latitude;
              const lon = ticket.location?.longitude;
              const hasProof = Boolean(ticket.proof_image_filename || ticket.proof_image_url || ticket.proof_image_bytes);
              const imgSrc = ticket.evidence_image_url || ticket.image_bytes || 'http://localhost:8000/api/images/sample_pothole_before.jpg';

              return (
                <div 
                  key={ticket.id} 
                  className="gov-card bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Card Top: Ticket ID + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        #{ticket.id}
                      </span>
                      {getStatusBadge(ticket.status)}
                    </div>

                    {/* Photo thumbnail */}
                    <div className="relative rounded-xl overflow-hidden bg-slate-100 h-44 border border-slate-200/70">
                      <img
                        src={imgSrc}
                        alt={ticket.problem}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'http://localhost:8000/api/images/sample_pothole_before.jpg';
                        }}
                      />
                      <div className="absolute bottom-2 left-2 bg-[#0a2540]/85 backdrop-blur-xs text-white text-[11px] font-mono px-2 py-0.5 rounded">
                        AI Conf: {(ticket.confidence ? (ticket.confidence * 100).toFixed(0) : 92)}%
                      </div>
                      {hasProof && (
                        <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Proof Attached
                        </div>
                      )}
                    </div>

                    {/* Defect Title & Location */}
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                        {ticket.problem}
                      </h4>
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="truncate font-medium">
                          {lat ? `${lat.toFixed(4)}, ${lon.toFixed(4)}` : 'Hyderabad Ward'} • Greater Hyderabad
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Upvote & Inspect Actions */}
                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Upvote Button */}
                    <button
                      type="button"
                      onClick={() => onVote && onVote(ticket.id)}
                      title="Endorse this public grievance to raise repair priority"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition active:scale-95 shadow-sm"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-amber-600" />
                      <span>{ticket.votes || 1} Upvotes</span>
                    </button>

                    {/* View Proof / Inspect Modal */}
                    <button
                      type="button"
                      onClick={() => onSelectTicket(ticket)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0a2540] hover:bg-[#153e6b] text-white text-xs font-bold transition shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Proof</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
