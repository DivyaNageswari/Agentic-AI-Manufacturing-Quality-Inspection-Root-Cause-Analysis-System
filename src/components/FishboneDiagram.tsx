import React, { useState } from 'react';
import { FishboneCategory } from '../types';
import { EpistemicBadge } from './EpistemicBadge';
import { HelpCircle, Star, Sparkles } from 'lucide-react';

interface Props {
  fishbone: FishboneCategory[];
  problemStatement: string;
}

export const FishboneDiagram: React.FC<Props> = ({
  fishbone,
  problemStatement,
}) => {
  const [selectedFactor, setSelectedFactor] = useState<{
    factor: string;
    evidence: string;
    category: string;
    isKeyDriver: boolean;
  } | null>(null);

  // Group categories into upper ribs (Machine, Method, Material) and lower ribs (Manpower, Measurement, Milieu)
  const upperCategories = fishbone.filter((c) =>
    ['Machine', 'Method', 'Material'].includes(c.category)
  );
  const lowerCategories = fishbone.filter((c) =>
    ['Manpower', 'Measurement', 'Milieu'].includes(c.category)
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm">
            Ishikawa (Fishbone) Cause-and-Effect Analysis
          </h3>
          <p className="text-xs text-slate-500">
            Categorized across the 6 Ms of Manufacturing · Click any branch factor to inspect evidence
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-medium">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span>Key Failure Driver</span>
          </span>
        </div>
      </div>

      {/* Visual Fishbone SVG & Grid Layout */}
      <div className="bg-slate-50/60 rounded-lg p-4 border border-slate-200 overflow-x-auto">
        {/* Upper Ribs (Machine, Method, Material) */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {upperCategories.map((cat) => (
            <div
              key={cat.category}
              className="bg-white rounded border border-slate-200 p-3 shadow-2xs relative"
            >
              <div className="font-bold text-xs text-slate-800 uppercase tracking-wider pb-1 mb-2 border-b border-slate-100 flex items-center justify-between">
                <span>{cat.category}</span>
                <span className="text-[10px] text-slate-400 font-mono">({cat.factors.length})</span>
              </div>
              <div className="space-y-2">
                {cat.factors.map((f) => (
                  <button
                    key={f.id}
                    onClick={() =>
                      setSelectedFactor({
                        factor: f.factor,
                        evidence: f.evidence,
                        category: cat.category,
                        isKeyDriver: f.isKeyDriver,
                      })
                    }
                    className={`w-full text-left p-2 rounded text-xs transition-colors border ${
                      f.isKeyDriver
                        ? 'bg-amber-50/80 border-amber-200 hover:bg-amber-100/60'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-medium text-slate-900 leading-snug">{f.factor}</span>
                      {f.isKeyDriver && (
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <EpistemicBadge type={f.epistemicType} size="sm" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Central Spine */}
        <div className="relative py-2 flex items-center justify-between">
          <div className="h-1 bg-slate-800 flex-1 relative rounded-full">
            <div className="absolute -top-1.5 left-1/4 w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></div>
            <div className="absolute -top-1.5 left-2/4 w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></div>
            <div className="absolute -top-1.5 left-3/4 w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></div>
          </div>

          {/* Spine Arrowhead connecting to Problem Statement */}
          <div className="ml-4 shrink-0 bg-slate-900 text-white px-4 py-2.5 rounded-lg border-2 border-slate-700 max-w-sm shadow-md">
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Target Nonconformance</span>
            </div>
            <div className="text-xs font-bold text-slate-100 mt-0.5 leading-snug">
              {problemStatement}
            </div>
          </div>
        </div>

        {/* Lower Ribs (Manpower, Measurement, Milieu) */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {lowerCategories.map((cat) => (
            <div
              key={cat.category}
              className="bg-white rounded border border-slate-200 p-3 shadow-2xs relative"
            >
              <div className="font-bold text-xs text-slate-800 uppercase tracking-wider pb-1 mb-2 border-b border-slate-100 flex items-center justify-between">
                <span>{cat.category}</span>
                <span className="text-[10px] text-slate-400 font-mono">({cat.factors.length})</span>
              </div>
              <div className="space-y-2">
                {cat.factors.map((f) => (
                  <button
                    key={f.id}
                    onClick={() =>
                      setSelectedFactor({
                        factor: f.factor,
                        evidence: f.evidence,
                        category: cat.category,
                        isKeyDriver: f.isKeyDriver,
                      })
                    }
                    className={`w-full text-left p-2 rounded text-xs transition-colors border ${
                      f.isKeyDriver
                        ? 'bg-amber-50/80 border-amber-200 hover:bg-amber-100/60'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="font-medium text-slate-900 leading-snug">{f.factor}</span>
                      {f.isKeyDriver && (
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <EpistemicBadge type={f.epistemicType} size="sm" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Factor Evidence Inspection Drawer */}
      {selectedFactor && (
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-950 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Evidence Ledger: {selectedFactor.category} · {selectedFactor.factor}</span>
            </span>
            {selectedFactor.isKeyDriver && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                Validated Key Driver
              </span>
            )}
          </div>
          <p className="text-slate-700 leading-relaxed pt-1">
            <span className="font-medium text-slate-900">Physical / Log Evidence:</span> {selectedFactor.evidence}
          </p>
        </div>
      )}
    </div>
  );
};
