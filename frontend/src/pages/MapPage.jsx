import React, { useState } from 'react';
import { ArrowLeft, Layers, MapPin, Filter } from 'lucide-react';
import OpenStreetMap from '../components/OpenStreetMap';

export default function MapPage({ tickets, onBack, onSelectTicket }) {
  const [filterType, setFilterType] = useState('all');

  const filteredTickets = tickets.filter(t => {
    if (filterType === 'all') return true;
    const p = (t.problem || '').toLowerCase();
    if (filterType === 'road') return !['traffic', 'vehicle', 'car', 'bus', 'truck', 'pedestrian', 'person', 'school'].some(k => p.includes(k));
    if (filterType === 'traffic') return ['traffic', 'vehicle', 'bottleneck', 'car', 'bus', 'truck', 'motorcycle'].some(k => p.includes(k));
    if (filterType === 'safety') return ['pedestrian', 'school', 'children', 'crossing', 'rash', 'hit_and_run', 'person'].some(k => p.includes(k));
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-emerald-600" />
              Live GIS City Map &bull; Hyderabad Metropolitan Region
            </h1>
            <p className="text-xs text-slate-600 font-mono">
              Real-time spatial telemetry from transit bus fleet across GHMC arterial roads
            </p>
          </div>
        </div>

        {/* Layer Filters */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg text-xs font-semibold">
          <span className="text-slate-500 font-mono px-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Layer:
          </span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-md transition ${filterType === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
          >
            All Pins ({tickets.length})
          </button>
          <button
            onClick={() => setFilterType('road')}
            className={`px-3 py-1 rounded-md transition ${filterType === 'road' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'}`}
          >
            Road Infra
          </button>
          <button
            onClick={() => setFilterType('traffic')}
            className={`px-3 py-1 rounded-md transition ${filterType === 'traffic' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600'}`}
          >
            Traffic
          </button>
          <button
            onClick={() => setFilterType('safety')}
            className={`px-3 py-1 rounded-md transition ${filterType === 'safety' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600'}`}
          >
            Safety
          </button>
        </div>
      </div>

      {/* Expanded Full-Size Map Canvas */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm h-[75vh]">
        <OpenStreetMap tickets={filteredTickets} onSelectTicket={onSelectTicket} />
      </div>
    </div>
  );
}
