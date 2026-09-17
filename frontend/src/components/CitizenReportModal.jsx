import React, { useState } from 'react';
import { X, Camera, MapPin, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CitizenReportModal({ isOpen, onClose, onTicketCreated }) {
  if (!isOpen) return null;

  const [problemType, setProblemType] = useState('Pothole');
  const [landmark, setLandmark] = useState('');
  const [description, setDescription] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const problemOptions = [
    { label: 'Pothole (Depth > 5cm)', val: 'Pothole' },
    { label: 'Road Surface Crack & Damage', val: 'Surface Crack & Damage' },
    { label: 'Waterlogging & Blocked Drain', val: 'Waterlogging & Blocked Drain' },
    { label: 'Traffic Bottleneck / Illegal Obstruction', val: 'Traffic Bottleneck' },
    { label: 'Pedestrian / Missing Zebra Crossing Hazard', val: 'Pedestrian Crossing Hazard' },
    { label: 'Damaged Median / Missing Signboard', val: 'Damaged Road Infrastructure' },
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setPhotoPreview(uploadEvent.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Default coordinates around Hyderabad civic wards
      const lat = 17.4325 + (Math.random() - 0.5) * 0.05;
      const lon = 78.4072 + (Math.random() - 0.5) * 0.05;

      const payload = {
        problem: `${problemType}: ${landmark || 'Public Road'}`,
        confidence: 0.95,
        location: { latitude: lat, longitude: lon },
        image_bytes: photoPreview || null,
      };

      const res = await fetch('https://margdarshak-117n.onrender.com/api/detections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onTicketCreated && onTicketCreated();
          onClose();
        }, 1800);
      } else {
        alert('Failed to submit grievance. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting report: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0a2540] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📢</span>
            <div>
              <h3 className="text-base font-bold">Report a Public Road Defect</h3>
              <p className="text-xs text-slate-300">GHMC Citizen Grievance Redressal</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {success ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-slate-900">Grievance Registered Successfully!</h4>
            <p className="text-xs text-slate-600">
              Your defect report has been assigned to the Zonal Road Maintenance Contractor under 48-Hour SLA.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Defect Classification *
              </label>
              <select
                value={problemType}
                onChange={(e) => setProblemType(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:bg-white focus:border-blue-600"
              >
                {problemOptions.map((opt) => (
                  <option key={opt.val} value={opt.val}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Locality / Landmark / Ward *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g., Near Jubilee Hills Rd 36, Metro Pillar 12"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Description / Urgency Details
              </label>
              <textarea
                rows="3"
                placeholder="Describe the severity (e.g. causes bike skidding, large crater, deep during rain)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Upload Photo Evidence (Optional)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition border border-slate-200">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Choose Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {photoPreview && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Photo Attached
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Registering...' : 'Submit Grievance'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
