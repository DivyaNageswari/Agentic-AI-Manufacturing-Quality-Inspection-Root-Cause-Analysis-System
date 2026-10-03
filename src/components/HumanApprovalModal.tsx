import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, Lock, FileSignature, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  entityType: 'BATCH' | 'CAPA' | 'ROOT_CAUSE' | 'QUARANTINE_RELEASE';
  entityId: string;
  defaultDecision?: 'APPROVED' | 'REJECTED' | 'QUARANTINED' | 'CONFIRMED';
  defaultNotes?: string;
  onConfirm: (payload: {
    engineerName: string;
    licenseBadgeId: string;
    decision: 'APPROVED' | 'REJECTED' | 'QUARANTINED' | 'CONFIRMED';
    notes: string;
    digitalSignatureToken: string;
  }) => Promise<void> | void;
}

export const HumanApprovalModal: React.FC<Props> = ({
  isOpen,
  onClose,
  title,
  entityType,
  entityId,
  defaultDecision = 'APPROVED',
  defaultNotes = '',
  onConfirm,
}) => {
  const [engineerName, setEngineerName] = useState('Dr. Marcus Sterling');
  const [licenseBadgeId, setLicenseBadgeId] = useState('ASQ-CQE-84912');
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | 'QUARANTINED' | 'CONFIRMED'>(defaultDecision);
  const [notes, setNotes] = useState(defaultNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedAcknowledgement, setConfirmedAcknowledgement] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedAcknowledgement) return;
    setIsSubmitting(true);
    const token = `SIG-SHA256-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    try {
      await onConfirm({
        engineerName,
        licenseBadgeId,
        decision,
        notes,
        digitalSignatureToken: token,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-semibold text-base leading-tight">Human Quality-Engineer Authorization Gate</h3>
              <p className="text-xs text-slate-300">Mandatory under ISO 9001:2015 §8.7 & IATF 16949</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold">Safety-Critical Decision Gate:</span> AI agents are restricted to advisory support. Final product release, quarantine lock, or parameter modification legally requires a certified Human Quality Engineer digital signature.
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Action</div>
            <div className="text-sm font-semibold text-slate-900 bg-slate-50 p-2.5 rounded border border-slate-200">
              {title} <span className="text-xs text-slate-500 font-normal">({entityType} ID: {entityId})</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Quality Engineer Name *
              </label>
              <input
                type="text"
                required
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                License / CQE Badge ID *
              </label>
              <input
                type="text"
                required
                value={licenseBadgeId}
                onChange={(e) => setLicenseBadgeId(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Formal Decision Verdict *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecision('APPROVED')}
                className={`py-2 px-3 text-xs font-semibold rounded border transition-colors ${
                  decision === 'APPROVED' || decision === 'CONFIRMED'
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {entityType === 'ROOT_CAUSE' ? 'Confirm Cause' : 'Authorize Release'}
              </button>
              <button
                type="button"
                onClick={() => setDecision('QUARANTINED')}
                className={`py-2 px-3 text-xs font-semibold rounded border transition-colors ${
                  decision === 'QUARANTINED'
                    ? 'bg-amber-600 text-white border-amber-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Lock Quarantine
              </button>
              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={`py-2 px-3 text-xs font-semibold rounded border transition-colors ${
                  decision === 'REJECTED'
                    ? 'bg-rose-600 text-white border-rose-700'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Reject / Scrap
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Engineering Rationale & Physical Verification Notes *
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. CMM calibration verified; laser arbor runout test measured +3.2 µm under 28°C; tool wear VB verified at 0.42 mm under 50x microscope."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
            />
          </div>

          {/* Acknowledgement Checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              required
              checked={confirmedAcknowledgement}
              onChange={(e) => setConfirmedAcknowledgement(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="text-xs text-slate-600 leading-normal">
              I certify that I have conducted physical verification and accept engineering responsibility for this disposition. This action will be immutably recorded in the ISO audit trail.
            </span>
          </label>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded border border-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!confirmedAcknowledgement || isSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FileSignature className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Audit...' : 'Digitally Sign & Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
