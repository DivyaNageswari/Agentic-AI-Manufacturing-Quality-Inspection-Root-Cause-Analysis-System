import React, { useState } from 'react';
import { QualityIncident } from '../types';
import { EpistemicBadge } from '../components/EpistemicBadge';
import { PageId } from '../components/Sidebar';
import {
  AlertTriangle,
  Plus,
  Lock,
  GitFork,
  ShieldCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  Boxes,
} from 'lucide-react';

interface Props {
  incidents: QualityIncident[];
  onNavigate: (page: PageId) => void;
  onCreateIncident?: (incident: Partial<QualityIncident>) => void;
}

export const IncidentsPage: React.FC<Props> = ({
  incidents,
  onNavigate,
  onCreateIncident,
}) => {
  const [selectedIncId, setSelectedIncId] = useState<string>(incidents[0]?.id || '');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newBatch, setNewBatch] = useState('LOT-2026-AERO-08');
  const [newSeverity, setNewSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');

  const selectedIncident = incidents.find((i) => i.id === selectedIncId) || incidents[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    if (onCreateIncident) {
      onCreateIncident({
        title: newTitle,
        description: newDesc,
        batchId: newBatch,
        severity: newSeverity,
      });
    }
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Quality Incidents & Containment Registry</h2>
          <p className="text-xs text-slate-500">
            Formal nonconformance incident logging, immediate containment tracking, and root cause initiation.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log New Quality Incident</span>
        </button>
      </div>

      {/* Grid: Incidents Table + Selected Incident Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-xs text-slate-800">
              Active Incidents Registry ({incidents.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">ISO 9001 §8.7</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {incidents.map((inc) => {
              const isSelected = inc.id === selectedIncId;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncId(inc.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{inc.incidentCode}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          inc.severity === 'CRITICAL'
                            ? 'bg-rose-600 text-white'
                            : inc.severity === 'HIGH'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{inc.timestamp}</span>
                  </div>

                  <div className="font-semibold text-xs text-slate-900 mb-1">{inc.title}</div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{inc.description}</p>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Lot: {inc.batchId}</span>
                    <span>Units: {inc.affectedUnitsCount} pcs</span>
                    <span className="font-bold text-rose-700">${inc.scrapCostEstimateUsd.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Incident Detail (5 cols) */}
        {selectedIncident && (
          <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Incident File</span>
                <h3 className="text-base font-bold text-slate-900 font-mono">{selectedIncident.incidentCode}</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300">
                {selectedIncident.status}
              </span>
            </div>

            <div>
              <h4 className="font-bold text-xs text-slate-900 mb-1">{selectedIncident.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{selectedIncident.description}</p>
            </div>

            {/* Observed Facts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Observed Facts (Empirical Evidence)</span>
                <EpistemicBadge type="OBSERVED_FACT" size="sm" />
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {selectedIncident.observedFacts.map((fact, i) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="font-mono text-blue-600 font-bold">[{i + 1}]</span>
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Immediate Containment Actions */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5 text-xs">
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Immediate Containment Actions (Executed):</span>
              </div>
              <div className="text-amber-900 whitespace-pre-line leading-relaxed text-[11px]">
                {selectedIncident.immediateContainment}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => onNavigate('rca')}
                className="flex-1 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span>Open RCA Workbench</span>
              </button>
              <button
                onClick={() => onNavigate('capa')}
                className="flex-1 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Manage CAPA</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Log New Quality Incident</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Incident Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spindle runout exceeding specification"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Affected Batch ID</label>
                  <input
                    type="text"
                    required
                    value={newBatch}
                    onChange={(e) => setNewBatch(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Severity Level</label>
                  <select
                    value={newSeverity}
                    onChange={(e: any) => setNewSeverity(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the nonconformance observed, sensor trends, or inspection findings..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
                >
                  Record Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
