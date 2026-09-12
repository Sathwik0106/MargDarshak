import React, { useState } from 'react';
import { 
  Shield, Globe, Search, Phone, CheckCircle, ChevronDown, 
  Users 
} from 'lucide-react';

export default function Header({ 
  portalMode = 'admin',
  onTogglePortalMode,
  tickets = [], 
  onEmergencyEscalate, 
  textSize = 'md', 
  setTextSize,
  searchQuery = '',
  setSearchQuery 
}) {
  const [currentLang, setCurrentLang] = useState('English');
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const languages = ['English', 'हिन्दी (Hindi)', 'తెలుగు (Telugu)'];

  return (
    <header className="sticky top-0 z-50 shadow-sm border-b border-slate-200">
      {/* 1. Official Government Utility & Accessibility Top-Strip */}
      <div className="bg-[#0a192f] text-slate-300 text-xs px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* State Government Crest / Shield SVG */}
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold tracking-wide">
            <svg className="w-3.5 h-3.5 fill-current text-amber-400" viewBox="0 0 24 24">
              <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm0 2.18l6 2.25v4.66c0 4.1-2.6 7.9-6 9-3.4-1.1-6-4.9-6-9V6.43l6-2.25zM12 6a3 3 0 100 6 3 3 0 000-6zm-1 7h2v5h-2v-5z"/>
            </svg>
            <span className="uppercase text-[11px] tracking-wider">Government of Telangana &bull; GHMC</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-300 text-[11px] hidden md:inline">
            Municipal Administration &amp; Urban Development
          </span>
        </div>

        <div className="flex items-center gap-3.5 text-xs">
          {/* Toll Free Helpline */}
          <div className="hidden lg:flex items-center gap-1 text-slate-300">
            <Phone className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px]">Toll-Free: <strong className="text-white font-mono font-semibold">155304</strong></span>
          </div>

          <span className="text-slate-700 hidden lg:inline">|</span>

          {/* Accessibility Font Size Switcher */}
          <div className="flex items-center gap-0.5 bg-slate-800/90 px-1.5 py-0.5 rounded border border-slate-700 text-[11px]">
            <span className="text-slate-400 text-[10px] mr-1">Font:</span>
            <button 
              onClick={() => setTextSize && setTextSize('sm')}
              title="Small Text"
              className={`px-1.5 py-0.5 text-[11px] font-bold rounded ${textSize === 'sm' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              A-
            </button>
            <button 
              onClick={() => setTextSize && setTextSize('md')}
              title="Default Text"
              className={`px-1.5 py-0.5 text-[11px] font-bold rounded ${textSize === 'md' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              A
            </button>
            <button 
              onClick={() => setTextSize && setTextSize('lg')}
              title="Large Text"
              className={`px-1.5 py-0.5 text-[11px] font-bold rounded ${textSize === 'lg' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
            >
              A+
            </button>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Multilingual Switcher */}
          <div className="relative">
            <button 
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1 bg-slate-800/90 hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-700 text-white text-[11px] font-medium transition"
            >
              <Globe className="w-3 h-3 text-amber-400" />
              <span>{currentLang}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-white text-slate-800 rounded-md shadow-lg border border-slate-200 py-1 z-50 text-xs">
                {languages.map(lang => (
                  <button
                    key={lang}
                    onClick={() => {
                      setCurrentLang(lang.split(' ')[0]);
                      setLangMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 font-medium flex items-center justify-between text-xs"
                  >
                    {lang}
                    {currentLang === lang.split(' ')[0] && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Executive Header */}
      <div className="bg-white px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Emblem & Department Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0a2540] flex items-center justify-center text-amber-400 shadow-sm border border-slate-300 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg lg:text-xl font-bold tracking-tight text-slate-900 leading-tight">
                MargDarshak
              </h1>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                portalMode === 'admin' 
                  ? 'bg-blue-50 text-blue-900 border-blue-200' 
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
              }`}>
                {portalMode === 'admin' ? 'Municipal Command Admin' : 'Public Grievance Portal'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Greater Hyderabad Municipal Corporation &bull; Road Maintenance &amp; Asset Management
            </p>
          </div>
        </div>

        {/* Center: Quick Search Bar */}
        <div className="hidden md:block relative w-72 lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search Ticket ID, Ward, Defect..."
            value={searchQuery}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
          />
        </div>

        {/* Right Section: Citizen / Admin Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Citizen / Admin Toggle Pill */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => onTogglePortalMode && onTogglePortalMode('user')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
                portalMode === 'user'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Citizen</span>
            </button>

            <button
              onClick={() => onTogglePortalMode && onTogglePortalMode('admin')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition ${
                portalMode === 'admin'
                  ? 'bg-[#0a2540] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
