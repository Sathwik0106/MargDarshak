import React, { useState } from 'react';
import { X, Upload, Video, Image, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function VideoRunnerModal({ isOpen, onClose, onSimulateSampleDetection }) {
  if (!isOpen) return null;

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setAnalysisResult(null);
      setStatusMessage('');

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setFilePreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setStatusMessage(`Uploading ${selectedFile.name} & running YOLO26m...`);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('latitude', '17.3850');
    formData.append('longitude', '78.4867');

    try {
      const res = await fetch('http://localhost:8000/api/analyze-upload', {
        method: 'POST',
        body: formData,
      });

      if (res.status === 202) {
        const acceptData = await res.json();
        const jobId = acceptData.job_id;
        setStatusMessage(`Upload accepted (202)! Video processing running in background worker (${jobId})...`);

        let isDone = false;
        let attempts = 0;
        while (!isDone && attempts < 60) {
          await new Promise((r) => setTimeout(r, 2000));
          attempts++;
          try {
            const jobRes = await fetch(`http://localhost:8000/api/jobs/${jobId}`);
            if (jobRes.ok) {
              const jobData = await jobRes.json();
              if (jobData.status === 'completed') {
                isDone = true;
                setStatusMessage('YOLO26m Video Analysis Complete! Defects saved to spatial database.');
                setAnalysisResult({
                  status: 'success',
                  type: 'video',
                  message: 'Video frames processed with 7m spatial deduplication & tickets generated.',
                });
              } else if (jobData.status === 'failed') {
                isDone = true;
                throw new Error(jobData.error || 'Video inference failed');
              } else {
                setStatusMessage(`Processing video in background (Job ${jobId})...`);
              }
            }
          } catch (e) {
            console.warn(e);
          }
        }
      } else {
        const data = await res.json();
        setAnalysisResult(data);
        setStatusMessage('AI analysis complete! Defect tickets & emails dispatched.');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage(`Upload failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 1-Click Quick Demo for Hackathon presentation
  const handleQuickDemo = () => {
    setIsProcessing(true);
    setStatusMessage('Simulating real-time bus camera stream in Hyderabad...');
    
    setTimeout(() => {
      onSimulateSampleDetection({
        problem: 'Pothole',
        confidence: 0.95,
        location: { latitude: 17.3850, longitude: 78.4867 },
      });
      setStatusMessage('Detected: Pothole -> Ticket created & dispatched to assigned GHMC Circle Engineer with T+3 statutory intake timer!');
      setIsProcessing(false);
      setAnalysisResult({ status: 'success', type: 'demo', message: 'Demo defect recorded.' });
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#0b2545] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <Upload className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold">Upload Road Video or Image</h3>
              <p className="text-xs text-slate-300">Automated YOLO26m Defect &amp; Hazard Sensing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-300 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* File Upload Drop Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono mb-2">
              Select Bus Camera Video or Incident Image
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center bg-slate-50/60 hover:bg-blue-50/20 transition cursor-pointer relative">
              <input
                type="file"
                accept="video/*,image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'Click to browse or drag & drop video/image'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports MP4, MOV, AVI, JPG, PNG (Bus Dashcam or Smartphone capture)
                </p>
                {selectedFile && (
                  <span className="mt-2.5 inline-block text-xs font-mono font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                    Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Type: {selectedFile.type || 'file'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Image Thumbnail Preview if an image is picked */}
          {filePreview && (
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center gap-4">
              <img src={filePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Image Preview Loaded</span>
                <span className="text-xs text-slate-500">Ready to run YOLO26m defect extraction</span>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              analysisResult ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={isProcessing}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              Or Run Quick Demo Detection
            </button>

            <button
              type="button"
              onClick={handleUploadAndAnalyze}
              disabled={!selectedFile || isProcessing}
              className="px-5 py-2.5 bg-[#0b2545] hover:bg-[#133560] disabled:opacity-40 text-white text-sm font-bold rounded-lg flex items-center gap-2 shadow-md transition"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Media...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-emerald-400" />
                  Upload &amp; Run AI Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
