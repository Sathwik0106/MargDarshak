import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CommandWorkspace from './components/CommandWorkspace';
import TicketTable from './components/TicketTable';
import ProofModal from './components/ProofModal';
import VideoRunnerModal from './components/VideoRunnerModal';
import CitizenWorkspace from './components/CitizenWorkspace';

// Dedicated Category Pages
import RoadInfraPage from './pages/RoadInfraPage';
import TrafficPage from './pages/TrafficPage';
import SafetyPage from './pages/SafetyPage';
import MapPage from './pages/MapPage';
import SlaMatrixPage from './pages/SlaMatrixPage';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [portalMode, setPortalMode] = useState('admin'); // 'admin' | 'user'
  const [activeTab, setActiveTab] = useState('workspace');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [alertBanner, setAlertBanner] = useState(null);
  const [textSize, setTextSize] = useState('md');
  const [searchQuery, setSearchQuery] = useState('');

  // Accessibility font-size root scaling
  useEffect(() => {
    document.documentElement.className = `text-size-${textSize}`;
  }, [textSize]);

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

  // Filtered tickets based on top search bar
  const displayedTickets = tickets.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.id && t.id.toLowerCase().includes(q)) ||
      (t.problem && t.problem.toLowerCase().includes(q)) ||
      (t.contractor_email && t.contractor_email.toLowerCase().includes(q))
    );
  });

  // Switch between Admin Mode and User (Citizen) Mode
  const handleTogglePortalMode = (mode) => {
    setPortalMode(mode);
    if (mode === 'admin') {
      if (!['workspace', 'map', 'tickets', 'sla'].includes(activeTab)) {
        setActiveTab('workspace');
      }
    } else {
      if (!['citizen_workspace', 'road', 'traffic', 'safety'].includes(activeTab)) {
        setActiveTab('citizen_workspace');
      }
    }
  };

  // Universal Back Navigation: returns to executive Command Workspace (Admin) or Grievance Tracker (Citizen)
  const handleBack = () => {
    if (portalMode === 'admin') {
      setActiveTab('workspace');
    } else {
      setActiveTab('citizen_workspace');
    }
  };

  // Upvote defect to increase public priority
  const handleVote = async (ticketId) => {
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${ticketId}/vote`, { method: 'POST' });
      if (res.ok) {
        fetchTickets();
        setSelectedTicket(prev => prev && prev.id === ticketId ? { ...prev, votes: (prev.votes || 1) + 1 } : prev);
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
  };

  // Trigger manual escalation
  const handleEscalate = async (ticketId) => {
    try {
      const res = await fetch(`${API_BASE}/api/tickets/${ticketId}/escalate`, { method: 'POST' });
      if (res.ok) {
        setAlertBanner(`[SLA ESCALATION DISPATCHED] Statutory T+7 SLA escalation notice dispatched to Zonal Commissioner for ticket #${ticketId}`);
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
          image_bytes: payload.image_bytes || null,
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
      {/* Top Government Navigation Header with Portal Switcher */}
      <Header
        portalMode={portalMode}
        onTogglePortalMode={handleTogglePortalMode}
        tickets={tickets}
        onEmergencyEscalate={handleEmergencyEscalateAll}
        textSize={textSize}
        setTextSize={setTextSize}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* SLA Alert Notification Banner */}
      {alertBanner && (
        <div className="bg-red-600 text-white text-xs px-6 py-2.5 font-mono font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{alertBanner}</span>
          </div>
          <button onClick={() => setAlertBanner(null)} className="text-white hover:underline text-xs bg-red-700 px-2 py-0.5 rounded">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Command Center Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Government Sidebar (dynamically partitioned by Portal Mode) */}
        <Sidebar
          portalMode={portalMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tickets={tickets}
          onOpenVideoModal={() => setIsVideoModalOpen(true)}
        />

        {/* Center Dynamic Page Content with Generous Government Whitespace */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#f8fafc]">
          
          {/* ========================================================
              ADMIN PAGES: Command Workspace, Live GIS, Grievance, 48h SLA
             ======================================================== */}
          {activeTab === 'workspace' && (
            <CommandWorkspace
              tickets={displayedTickets}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
              onEscalateTicket={handleEscalate}
              onVote={handleVote}
            />
          )}

          {activeTab === 'map' && (
            <MapPage
              tickets={displayedTickets}
              onBack={handleBack}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
            />
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <div className="gov-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBack}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                    title="Go back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="gov-section-header text-xl">
                      Master Municipal Defect Registry
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Audit queue, officer dispatches, and evidentiary records across Hyderabad zones
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right font-mono bg-slate-50 border border-slate-200/80 p-3 sm:p-4 rounded-xl">
                  <span className="gov-card-label block text-[10px]">Total In Database</span>
                  <span className="gov-stat-value text-blue-700 block mt-0.5">{tickets.length}</span>
                </div>
              </div>

              <TicketTable
                tickets={displayedTickets}
                totalCount={tickets.length}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onSelectTicket={(ticket) => setSelectedTicket(ticket)}
                onEscalateTicket={handleEscalate}
                onVote={handleVote}
                portalMode={portalMode}
              />
            </div>
          )}

          {activeTab === 'sla' && (
            <SlaMatrixPage
              tickets={displayedTickets}
              onBack={handleBack}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
              onEscalateTicket={handleEscalate}
              onVote={handleVote}
            />
          )}

          {/* ========================================================
              USER / CITIZEN PAGES: Overview, Road Infra, Traffic Flow, Safety
             ======================================================== */}
          {activeTab === 'citizen_workspace' && (
            <CitizenWorkspace
              tickets={displayedTickets}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
              onVote={handleVote}
            />
          )}

          {activeTab === 'road' && (
            <RoadInfraPage
              tickets={displayedTickets}
              portalMode={portalMode}
              onBack={handleBack}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
              onEscalateTicket={handleEscalate}
              onVote={handleVote}
            />
          )}

          {activeTab === 'traffic' && (
            <TrafficPage
              tickets={displayedTickets}
              portalMode={portalMode}
              onBack={handleBack}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
              onEscalateTicket={handleEscalate}
              onVote={handleVote}
            />
          )}

          {activeTab === 'safety' && (
            <SafetyPage
              tickets={displayedTickets}
              portalMode={portalMode}
              onBack={handleBack}
              onSelectTicket={(ticket) => setSelectedTicket(ticket)}
              onEscalateTicket={handleEscalate}
              onVote={handleVote}
            />
          )}
        </main>
      </div>

      {/* Evidentiary Inspection Modal (Before vs After Photo Proof) */}
      <ProofModal
        ticket={selectedTicket}
        portalMode={portalMode}
        onClose={() => setSelectedTicket(null)}
        onEscalate={handleEscalate}
        onVote={handleVote}
      />

      {/* Video Runner Modal (Fleet Survey Processing) */}
      <VideoRunnerModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSimulateSampleDetection={handleSimulateDetection}
      />
    </div>
  );
}
