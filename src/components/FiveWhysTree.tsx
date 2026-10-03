import React from 'react';
import { FiveWhysStep } from '../types';
import { EpistemicBadge } from './EpistemicBadge';
import { ArrowDown, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  steps: FiveWhysStep[];
  onVerifyStep?: (stepNumber: number) => void;
}

export const FiveWhysTree: React.FC<Props> = ({ steps, onVerifyStep }) => {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">
            5-Whys Root Cause Recursive Deduction
          </h3>
          <p className="text-xs text-slate-500">
            Traces direct physical failure back to systemic process and engineering parameters
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Evidence-Linked Trace</span>
        </div>
      </div>

      <div className="relative pl-6 space-y-4">
        {/* Vertical connector line */}
        <div className="absolute left-3 top-2 bottom-6 w-0.5 bg-slate-300"></div>

        {steps.map((s, idx) => (
          <div key={s.step} className="relative group">
            {/* Step node indicator on line */}
            <div className={`absolute -left-6 top-2.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono border-2 border-white shadow-xs ${
              s.verified
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-500 text-white'
            }`}>
              {s.step}
            </div>

            {/* Card Content */}
            <div className={`p-4 rounded-lg border transition-all ${
              s.step === 5
                ? 'bg-amber-50/50 border-amber-300 shadow-xs'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}>
              {/* Question */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="font-semibold text-xs text-slate-900">
                  <span className="text-blue-600 uppercase font-mono font-bold mr-1.5">Why #{s.step}:</span>
                  {s.question}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <EpistemicBadge type={s.epistemicType} size="sm" />
                  {s.verified ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-medium">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Unconfirmed
                    </span>
                  )}
                </div>
              </div>

              {/* Deductive Answer */}
              <div className="text-xs text-slate-800 bg-white p-2.5 rounded border border-slate-200/80 mb-2 font-medium">
                <span className="text-slate-500 font-normal">Finding: </span>
                {s.answer}
              </div>

              {/* Supporting Evidence Chain */}
              <div className="text-[11px] text-slate-600 flex items-start gap-1.5">
                <span className="font-semibold text-slate-700 shrink-0">Physical Evidence:</span>
                <span>{s.evidence}</span>
              </div>
            </div>

            {/* Downward indicator between steps */}
            {idx < steps.length - 1 && (
              <div className="flex justify-center -my-2 py-1">
                <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
