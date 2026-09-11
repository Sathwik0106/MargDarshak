import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CommandWorkspace from './components/CommandWorkspace';
import TicketTable from './components/TicketTable';
import ProofModal from './components/ProofModal';
import VideoRunnerModal from './components/VideoRunnerModal';

// Dedicated Category Pages
import RoadInfraPage from './pages/RoadInfraPage';
import TrafficPage from './pages/TrafficPage';
import SafetyPage from './pages/SafetyPage';
import MapPage from './pages/MapPage';
import SlaMatrixPage from './pages/SlaMatrixPage';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('workspace');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [alertBanner, setAlertBanner] = useState(null);

  // Fetch tickets from backend
  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tickets`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.warn('Backend offline or unreachable, retrying...', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 3000);
    return () => clearInterval(interval);
  }, []);

  // Trigger manual escalation
  const handleEscalate = async (ticketId) => {
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${ticketId}/escalate`, { method: 'POST' });
      if (res.ok) {
        setAlertBanner(`[SLA ESCALATION DISPATCHED] Alert email sent to lingarajusaikumar@gmail.com for ticket #${ticketId}`);
        fetchTickets();
        setTimeout(() => setAlertBanner(null), 6000);
      }
    } catch (err) {
      alert(`Escalation error: ${err.message}`);
    }
  };

  // Emergency Escalation of all unacknowledged tickets
  const handleEmergencyEscalateAll = async () => {
    const unacknowledged = tickets.filter(t => t.status === 'ASSIGNED_TO_CONTRACTOR');
    if (unacknowledged.length === 0) {
      alert('No unacknowledged tickets currently requiring emergency escalation.');
      return;
    }
    for (const t of unacknowledged) {
      await handleEscalate(t.id);
    }
  };

  // Simulate detection from in-dashboard Video Runner
  const handleSimulateDetection = async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/api/detections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: payload.problem,
          confidence: payload.confidence,
          location: payload.location,
          image_bytes: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        }),
      });
      if (res.ok) {
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-800 font-sans">
      {/* Top Government Navigation Header */}
      <Header
        tickets={tickets}
        onEmergencyEscalate={handleEmergencyEscalateAll}
      />

      {/* SLA Alert Notification Banner */}
      {alertBanner && (
        <div className="bg-red-600 text-white text-xs px-4 py-2 font-mono font-bold flex items-center justify-between animate-pulse">
          <span>⚠️ {alertBanner}</span>
          <button onClick={() => setAlertBanner(null)} className="text-white hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Command Center Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Government Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tickets={tickets}
          onOpenVideoModal={() => setIsVideoModalOpen(true)}
        />

        {/* Center Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-5 bg-[#f8fafc]">
          {/* 1. COMMAND WORKSPACE (EXECUTIVE INSIGHTS - NO MAP, NO CLUTTER) */}
          {activeTab === 'workspace' && (
            <CommandWorkspace
              tickets={tickets}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
            />
          )}

          {/* 2. DEDICATED ROAD INFRASTRUCTURE PAGE */}
          {activeTab === 'road' && (
            <RoadInfraPage
              tickets={tickets}
              onBack={() => setActiveTab('workspace')}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
              onEscalateTicket={handleEscalate}
            />
          )}

          {/* 3. DEDICATED TRAFFIC INTELLIGENCE PAGE */}
          {activeTab === 'traffic' && (
            <TrafficPage
              tickets={tickets}
              onBack={() => setActiveTab('workspace')}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
              onEscalateTicket={handleEscalate}
            />
          )}

          {/* 4. DEDICATED SAFETY INTELLIGENCE PAGE */}
          {activeTab === 'safety' && (
            <SafetyPage
              tickets={tickets}
              onBack={() => setActiveTab('workspace')}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
              onEscalateTicket={handleEscalate}
            />
          )}

          {/* 5. DEDICATED FULL-SCREEN GIS MAP PAGE */}
          {activeTab === 'map' && (
            <MapPage
              tickets={tickets}
              onBack={() => setActiveTab('workspace')}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
            />
          )}

          {/* 6. DEDICATED SLA ESCALATION MATRIX PAGE */}
          {activeTab === 'sla' && (
            <SlaMatrixPage
              tickets={tickets}
              onBack={() => setActiveTab('workspace')}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
              onEscalateTicket={handleEscalate}
            />
          )}

          {/* 7. DEDICATED ACTIVE MASTER TICKETS AUDIT QUEUE */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    Master Defect Tickets Audit Queue
                  </h1>
                  <p className="text-sm text-slate-600">
                    Complete city-wide municipal defect records, contractor actions, and verified proof photos
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-slate-500 block uppercase">Total Logged</span>
                  <span className="text-3xl font-extrabold text-blue-700">{tickets.length}</span>
                </div>
              </div>

              <TicketTable
                tickets={tickets}
                totalCount={tickets.length}
                activeTab="workspace"
                setActiveTab={setActiveTab}
                onSelectTicket={(ticket) => setSelectedTicket(ticket)}
                onEscalateTicket={handleEscalate}
              />
            </div>
          )}
        </main>
      </div>

      {/* Inspection Modal (Before vs After Photo Proof) */}
      <ProofModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onEscalate={handleEscalate}
      />

      {/* Video / Media Upload Modal */}
      <VideoRunnerModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSimulateSampleDetection={handleSimulateDetection}
      />
    </div>
  );
}
