import React, { useState } from 'react';
import {
  ShieldCheck,
  Info,
  Lock,
  UserCheck,
  X,
  Sliders,
  Menu,
} from 'lucide-react';
import { EpistemicBadge } from './EpistemicBadge';

interface Props {
  activeLine: string;
  onSelectLine: (line: string) => void;
  lines: string[];
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<Props> = ({
  activeLine,
  onSelectLine,
  lines,
  onToggleMobileMenu,
}) => {
  const [showEpistemicInfo, setShowEpistemicInfo] = useState(false);

  return (
    <>
      <header className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-30 shadow-xs">
        <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3">
            {onToggleMobileMenu && (
              <button
                onClick={onToggleMobileMenu}
                className="md:hidden p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer"
                title="Toggle Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="w-8 h-8 rounded bg-blue-700 flex items-center justify-center font-bold text-white font-mono text-sm tracking-wider shadow-xs shrink-0">
              QMS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm tracking-tight text-white font-sans">
                  Manufacturing Quality Control & RCA Platform
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  ISO 9001 / AS9100D
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Industrial Decision Support · Deterministic SPC · Transfer-Learning CNN · Human Sign-off Gate
              </p>
            </div>
          </div>

          {/* Controls & Badges */}
          <div className="flex items-center gap-4">
            {/* Active Production Line Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded border border-slate-700 text-xs">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">Line:</span>
              <select
                value={activeLine}
                onChange={(e) => onSelectLine(e.target.value)}
                className="bg-transparent text-slate-100 font-medium focus:outline-hidden cursor-pointer"
              >
                {lines.map((l) => (
                  <option key={l} value={l} className="bg-slate-900 text-white">
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Epistemic Hierarchy Info Button */}
            <button
              onClick={() => setShowEpistemicInfo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Epistemic Ledger</span>
            </button>

            {/* Safety Gate Enforced Indicator */}
            <div
              title="Autonomous rejection/release is prohibited by system policy. A human engineer signature is mandatory for final decisions."
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-950/70 border border-emerald-800/80 text-[11px] text-emerald-300"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold tracking-wide">Human Gate: Active</span>
            </div>

            {/* Logged in Quality Engineer */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                <UserCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-medium text-slate-200 leading-tight">Dr. Marcus Sterling</div>
                <div className="text-[10px] text-slate-400">ASQ CQE #84912 · Lead Metrologist</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Epistemic Classification Modal */}
      {showEpistemicInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-base">Five-Tier Epistemic Status Governance</h3>
              </div>
              <button
                onClick={() => setShowEpistemicInfo(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs leading-relaxed text-slate-700">
              <p>
                To avoid AI hallucinations and ensure compliance with ISO 9001:2015 §8.7 and IATF 16949, this platform enforces a strict epistemic taxonomy across all findings:
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between">
                    <EpistemicBadge type="OBSERVED_FACT" />
                    <span className="text-[10px] text-slate-500 font-mono">Tier 1: Ground Truth</span>
                  </div>
                  <p className="text-slate-600">
                    Physical sensor telemetry (spindle speed, temperatures, vibration), CMM coordinate measurements, barcode scans, and operator physical inspection logs.
                  </p>
                </div>

                <div className="p-3 rounded border border-indigo-200 bg-indigo-50/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <EpistemicBadge type="MODEL_PREDICTION" />
                    <span className="text-[10px] text-indigo-500 font-mono">Tier 2: Inferred</span>
                  </div>
                  <p className="text-slate-600">
                    Outputs from computer vision convolutional neural networks (YOLOv11/ResNet50 FPN) including bounding boxes, defect classifications, and confidence probabilities. Subject to false positives.
                  </p>
                </div>

                <div className="p-3 rounded border border-cyan-200 bg-cyan-50/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <EpistemicBadge type="STATISTICAL_FINDING" />
                    <span className="text-[10px] text-cyan-600 font-mono">Tier 3: Deterministic Math</span>
                  </div>
                  <p className="text-slate-600">
                    Calculated strictly using deterministic formulas (ASTM E2587 / ISO 7870): X-bar/R control limits, Nelson Rules 1-8, Process Capability (Cp, Cpk), and Mahalanobis distances. Never generated by an LLM.
                  </p>
                </div>

                <div className="p-3 rounded border border-amber-200 bg-amber-50/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <EpistemicBadge type="RCA_HYPOTHESIS" />
                    <span className="text-[10px] text-amber-600 font-mono">Tier 4: Causal Reasoning</span>
                  </div>
                  <p className="text-slate-600">
                    Formulated by multi-agent reasoning and RAG retrieval over past incidents. Generates 5-Whys and Fishbone branches. Remains an unverified hypothesis until physical verification is performed.
                  </p>
                </div>

                <div className="p-3 rounded border border-emerald-200 bg-emerald-50/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <EpistemicBadge type="CONFIRMED_ROOT_CAUSE" />
                    <span className="text-[10px] text-emerald-600 font-mono">Tier 5: Legally Certified</span>
                  </div>
                  <p className="text-slate-600">
                    Elevated ONLY when a licensed Human Quality Engineer conducts physical verification, records laboratory test notes, and signs with a digital audit token.
                  </p>
                </div>

                <div className="p-3 rounded border border-purple-200 bg-purple-50/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <EpistemicBadge type="HUMAN_DECISION" />
                    <span className="text-[10px] text-purple-700 font-mono">Tier 6: Human Authorization</span>
                  </div>
                  <p className="text-slate-600">
                    Quality engineer disposition sign-offs (Quarantine locks, CAPA releases, disposal authorizations, effectiveness verifications). AI is legally prohibited from autonomous disposition.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowEpistemicInfo(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
