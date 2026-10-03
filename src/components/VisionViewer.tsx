import React, { useState } from 'react';
import { VisualInspectionItem } from '../types';
import { EpistemicBadge } from './EpistemicBadge';
import { Eye, ShieldAlert, Cpu, CheckCircle2, XCircle, Sliders, Layers } from 'lucide-react';

interface Props {
  item: VisualInspectionItem;
  onUpdateVerdict?: (itemId: string, verdict: 'CONFIRMED_DEFECT' | 'FALSE_POSITIVE' | 'PASSED_OVERRIDE', notes: string) => void;
}

export const VisionViewer: React.FC<Props> = ({ item, onUpdateVerdict }) => {
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.70);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedDefectIdx, setSelectedDefectIdx] = useState<number | null>(0);
  const [overrideNotes, setOverrideNotes] = useState('');

  const visibleDefects = item.defects.filter((d) => d.confidence >= confidenceThreshold);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 text-sm">
              Computer Vision Surface Inspection: {item.partSerialNumber}
            </h3>
            <EpistemicBadge type={item.epistemicType} size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Component: <span className="font-semibold text-slate-700">{item.componentType}</span> · Batch: {item.batchId}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
            {item.cnnModelVersion}
          </span>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
        {/* Confidence slider */}
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600 font-medium">Confidence Filter:</span>
          <input
            type="range"
            min="0.50"
            max="0.98"
            step="0.02"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
            className="w-28 accent-indigo-600 cursor-pointer"
          />
          <span className="font-mono font-bold text-slate-800">
            {(confidenceThreshold * 100).toFixed(0)}%
          </span>
        </div>

        {/* Grad-CAM Heatmap Toggle */}
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors ${
            showHeatmap
              ? 'bg-purple-600 text-white border-purple-700'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Grad-CAM Activation Heatmap: {showHeatmap ? 'ON' : 'OFF'}</span>
        </button>

        {/* Status Pill */}
        <div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold ${
            item.status === 'NON_CONFORMING'
              ? 'bg-rose-100 text-rose-800 border border-rose-300'
              : item.status === 'REQUIRES_REVIEW'
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          }`}>
            {item.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Inspection Canvas & Detail split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Optical Surface Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 rounded-lg p-3 relative flex items-center justify-center min-h-[340px] border border-slate-800 overflow-hidden select-none">
          {/* Simulated High-Res Aerospace Machined Bearing Race SVG */}
          <svg className="w-full h-80 max-w-md" viewBox="0 0 400 400">
            <defs>
              {/* Radial gradient representing metal machined finish */}
              <radialGradient id="metalFinish" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="35%" stopColor="#334155" />
                <stop offset="70%" stopColor="#1e293b" />
                <stop offset="90%" stopColor="#475569" />
                <stop offset="100%" stopColor="#0f172a" />
              </radialGradient>

              {/* Heatmap overlay gradient */}
              <radialGradient id="gradcamGlow" cx="42%" cy="38%" r="35%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.7" />
                <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
              </radialGradient>

              <pattern id="machiningLatheRings" width="400" height="400" patternUnits="userSpaceOnUse">
                <circle cx="200" cy="200" r="180" fill="none" stroke="#64748b" strokeWidth="0.5" strokeOpacity="0.3" />
                <circle cx="200" cy="200" r="160" fill="none" stroke="#64748b" strokeWidth="0.5" strokeOpacity="0.3" />
                <circle cx="200" cy="200" r="140" fill="none" stroke="#64748b" strokeWidth="0.5" strokeOpacity="0.4" />
                <circle cx="200" cy="200" r="120" fill="none" stroke="#64748b" strokeWidth="0.5" strokeOpacity="0.4" />
                <circle cx="200" cy="200" r="100" fill="none" stroke="#64748b" strokeWidth="0.5" strokeOpacity="0.5" />
                <circle cx="200" cy="200" r="80" fill="none" stroke="#64748b" strokeWidth="0.5" strokeOpacity="0.5" />
              </pattern>
            </defs>

            {/* Base component body */}
            <circle cx="200" cy="200" r="190" fill="url(#metalFinish)" stroke="#475569" strokeWidth="2" />
            <rect width="400" height="400" fill="url(#machiningLatheRings)" />

            {/* Center Bore (85.000 mm nominal) */}
            <circle cx="200" cy="200" r="95" fill="#090d16" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="6 3" />
            <circle cx="200" cy="200" r="95" fill="none" stroke="#0ea5e9" strokeWidth="0.5" opacity="0.3" />

            {/* 8 Flange Bolt Holes */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x = 200 + 150 * Math.cos(rad);
              const y = 200 + 150 * Math.sin(rad);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="12"
                  fill="#020617"
                  stroke="#64748b"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* Simulated Defect 1: Thermal Micro-crack on bearing race */}
            <path
              d="M 170 145 Q 178 152 185 148 T 205 160"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Simulated Defect 2: Surface Porosity Pit */}
            <circle cx="272" cy="210" r="5" fill="#e11d48" opacity="0.8" />
            <circle cx="277" cy="214" r="3" fill="#e11d48" opacity="0.7" />

            {/* Grad-CAM Heatmap layer if toggled */}
            {showHeatmap && (
              <rect x="0" y="0" width="400" height="400" fill="url(#gradcamGlow)" pointerEvents="none" />
            )}

            {/* Render YOLO/CNN Defect Bounding Boxes */}
            {visibleDefects.map((d, idx) => {
              const px = (d.x / 100) * 400;
              const py = (d.y / 100) * 400;
              const pw = (d.width / 100) * 400;
              const ph = (d.height / 100) * 400;
              const isSelected = selectedDefectIdx === idx;

              return (
                <g
                  key={idx}
                  onClick={() => setSelectedDefectIdx(idx)}
                  className="cursor-pointer"
                >
                  <rect
                    x={px}
                    y={py}
                    width={pw}
                    height={ph}
                    fill={isSelected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(244, 63, 94, 0.08)'}
                    stroke={isSelected ? '#ef4444' : '#f43f5e'}
                    strokeWidth={isSelected ? '2' : '1.5'}
                    strokeDasharray={isSelected ? 'none' : '3 2'}
                  />
                  {/* Bounding box label tag */}
                  <rect
                    x={px}
                    y={py - 18}
                    width={pw > 110 ? pw : 110}
                    height="18"
                    fill="#ef4444"
                    rx="2"
                  />
                  <text
                    x={px + 4}
                    y={py - 5}
                    fill="#ffffff"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {d.defectClass} ({(d.confidence * 100).toFixed(0)}%)
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Coordinate HUD */}
          <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 font-mono flex items-center gap-3">
            <span>RES: 2048x2048 telecentric</span>
            <span>MAG: 12.5x</span>
            <span>POLARIZER: Cross-Linear 90°</span>
          </div>
        </div>

        {/* Detections & Human Disposition Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Detected Defects List */}
          <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50/50">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                <span>CNN Detections ({visibleDefects.length})</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Threshold: {(confidenceThreshold * 100).toFixed(0)}%
              </span>
            </div>

            {visibleDefects.length === 0 ? (
              <div className="text-xs text-slate-500 p-3 text-center bg-white rounded border border-dashed border-slate-200">
                No defect features meet the current confidence threshold.
              </div>
            ) : (
              visibleDefects.map((d, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedDefectIdx(i)}
                  className={`p-2 rounded border text-xs cursor-pointer transition-colors ${
                    selectedDefectIdx === i
                      ? 'bg-rose-50 border-rose-300 text-rose-950 font-medium'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{d.defectClass}</span>
                    <span className="font-mono text-rose-600 font-bold">
                      {(d.confidence * 100).toFixed(1)}% conf
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                    <span>Area: {d.areaMm2.toFixed(2)} mm²</span>
                    <span>Coordinates: [{d.x}%, {d.y}%]</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Model Architecture Transparency Note */}
          <div className="p-2.5 rounded bg-indigo-50/60 border border-indigo-200 text-xs text-indigo-950 space-y-1">
            <div className="font-semibold flex items-center gap-1 text-[11px] uppercase tracking-wide">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Vision Architecture & Pretraining</span>
            </div>
            <p className="text-[11px] text-indigo-900/80 leading-relaxed">
              Backbone: ResNet-50 Feature Pyramid Network with Focal Loss. Pretrained on industrial surface flaw datasets (MVTec AD) to segment micro-scale metallurgical anomalies.
            </p>
          </div>

          {/* Human Quality Inspector Override / Verification */}
          <div className="border border-slate-200 rounded-lg p-3 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                Inspector Verification & Verdict
              </span>
              {item.humanVerdict && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {item.humanVerdict.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            {item.inspectionNotes && (
              <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                <span className="font-semibold text-slate-700">Inspector Notes: </span>
                {item.inspectionNotes}
              </div>
            )}

            <div className="space-y-1.5">
              <input
                type="text"
                placeholder="Optional verification remark..."
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-slate-800 focus:outline-hidden"
              />
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateVerdict &&
                    onUpdateVerdict(item.id, 'CONFIRMED_DEFECT', overrideNotes || 'Confirmed under optical microscope.')
                  }
                  className="px-2 py-1.5 text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors"
                >
                  Confirm Defect
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateVerdict &&
                    onUpdateVerdict(item.id, 'FALSE_POSITIVE', overrideNotes || 'Artifact ruled out as surface solvent stain.')
                  }
                  className="px-2 py-1.5 text-[11px] font-semibold bg-slate-700 hover:bg-slate-800 text-white rounded transition-colors"
                >
                  False Positive
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateVerdict &&
                    onUpdateVerdict(item.id, 'PASSED_OVERRIDE', overrideNotes || 'Minor scratch within allowable cosmetic standard.')
                  }
                  className="px-2 py-1.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                >
                  Pass Override
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
