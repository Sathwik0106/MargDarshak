import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function OpenStreetMap({ tickets, onSelectTicket }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Hyderabad Coordinates (Charminar / Hussain Sagar / GHMC Command Center)
  const HYDERABAD_LAT = 17.3850;
  const HYDERABAD_LON = 78.4867;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = tickets.length > 0 ? tickets[0].location.latitude : HYDERABAD_LAT;
    const initialLon = tickets.length > 0 ? tickets[0].location.longitude : HYDERABAD_LON;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: 13,
        zoomControl: true,
      });

      // OpenStreetMap Tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }
  }, []);

  // Update markers whenever tickets change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    const bounds = [];

    // If no tickets yet, set view back to Hyderabad central
    if (tickets.length === 0) {
      mapInstanceRef.current.setView([HYDERABAD_LAT, HYDERABAD_LON], 13);
      return;
    }

    tickets.forEach((ticket) => {
      const lat = ticket.location?.latitude;
      const lon = ticket.location?.longitude;
      if (!lat || !lon) return;

      bounds.push([lat, lon]);

      let color = '#2563eb';
      let statusLabel = 'Assigned';
      if (ticket.status === 'ESCALATED_ZONAL') {
        color = '#dc2626';
        statusLabel = 'ESCALATED';
      } else if (ticket.status === 'RESOLVED') {
        color = '#16a34a';
        statusLabel = 'RESOLVED';
      } else if (ticket.status === 'IN_PROGRESS') {
        color = '#d97706';
        statusLabel = 'IN PROGRESS';
      }

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${color}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${color}; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">
              ${ticket.votes || 1}
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([lat, lon], { icon: customIcon });

      const imageSrc = ticket.image_bytes
        ? `data:image/jpeg;base64,${ticket.image_bytes}`
        : '';

      const popupHtml = `
        <div style="font-family: Inter, sans-serif; width: 260px; font-size: 14px; color: #1e293b; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <b style="color: #0b2545; font-size: 15px;">#${ticket.id}</b>
            <span style="background: ${color}20; color: ${color}; font-weight: bold; font-size: 12px; padding: 3px 8px; border-radius: 4px;">
              ${statusLabel}
            </span>
          </div>
          <div style="margin-bottom: 6px; font-size: 14px;"><b>Issue:</b> <span style="text-transform: capitalize; color: #b91c1c; font-weight: bold;">${ticket.problem}</span></div>
          <div style="margin-bottom: 6px; font-size: 13px;"><b>Priority:</b> <b style="color: #d97706; background: #fef3c7; padding: 2px 6px; border-radius: 4px;">${ticket.votes || 1} Fleet Vote(s)</b></div>
          <div style="margin-bottom: 8px; color: #64748b; font-size: 12px; font-family: monospace;">Location: ${lat.toFixed(5)}, ${lon.toFixed(5)}</div>
          ${
            imageSrc
              ? `<img src="${imageSrc}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; margin-bottom: 10px;" />`
              : ''
          }
          <button id="btn-inspect-${ticket.id}" style="background: #0b2545; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: bold; width: 100%; cursor: pointer;">
            Inspect Defect Proof & Details
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-inspect-${ticket.id}`);
        if (btn) {
          btn.onclick = () => onSelectTicket(ticket);
        }
      });

      markersLayerRef.current.addLayer(marker);
    });

    if (bounds.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    } else if (bounds.length === 1) {
      mapInstanceRef.current.setView(bounds[0], 14);
    }
  }, [tickets]);

  return (
    <div className="relative w-full h-[520px] bg-slate-100 rounded-xl overflow-hidden border border-slate-300 shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Map Legend Overlay with larger, readable typography */}
      <div className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-md px-4 py-3 rounded-lg shadow-lg border border-slate-200 text-sm font-sans space-y-1.5">
        <div className="font-bold text-slate-900 text-xs tracking-wider uppercase font-mono mb-1">
          HYDERABAD DEFECT SEVERITY
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
          <span className="w-3 h-3 rounded-full bg-red-600 shrink-0"></span>
          <span>Escalated / Critical (SLA Breach)</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
          <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></span>
          <span>Assigned / In Progress</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
          <span className="w-3 h-3 rounded-full bg-emerald-600 shrink-0"></span>
          <span>Resolved (Verified Photo Proof)</span>
        </div>
      </div>
    </div>
  );
}
