import React, { useState } from 'react';
import { ProductConfig, ToleranceSpec } from '../types';
import { EpistemicBadge } from '../components/EpistemicBadge';
import { Sliders, Plus, CheckCircle2, Shield, Ruler, FileSpreadsheet } from 'lucide-react';

interface Props {
  products: ProductConfig[];
  onUpdateProduct?: (product: ProductConfig) => void;
}

export const ProductConfigPage: React.FC<Props> = ({ products }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || 'prod-1');
  const [showAddToleranceModal, setShowAddToleranceModal] = useState(false);
  const [newParam, setNewParam] = useState('');
  const [newUnit, setNewUnit] = useState('mm');
  const [newNominal, setNewNominal] = useState(50.0);
  const [newUsl, setNewUsl] = useState(50.015);
  const [newLsl, setNewLsl] = useState(49.985);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleAddTolerance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParam) return;
    const newTol: ToleranceSpec = {
      parameter: newParam,
      unit: newUnit,
      nominal: Number(newNominal),
      usl: Number(newUsl),
      lsl: Number(newLsl),
      warningMarginPct: 20,
    };
    selectedProduct.tolerances.push(newTol);
    setShowAddToleranceModal(false);
    setNewParam('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Product Configuration & Tolerance Architecture</h2>
          <p className="text-xs text-slate-500">
            Define Engineering Nominal, USL, LSL, Critical-to-Quality (CTQ) points, and AQL sampling parameters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EpistemicBadge type="OBSERVED_FACT" size="sm" />
        </div>
      </div>

      {/* Product Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((p) => {
          const isSelected = p.id === selectedProductId;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedProductId(p.id)}
              className={`p-4 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'bg-blue-50/50 border-blue-600 shadow-xs ring-1 ring-blue-600'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-blue-700">{p.productCode}</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {p.category}
                </span>
              </div>
              <div className="font-semibold text-xs text-slate-900 mt-1">{p.name}</div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{p.description}</div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span>Sampling: {p.aqlLevel}</span>
                <span className="font-medium text-slate-700">{p.tolerances.length} Parameters</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Product Specifications Detail */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900">{selectedProduct.name}</h3>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {selectedProduct.productCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Category: {selectedProduct.category} · Sampling AQL: {selectedProduct.aqlLevel}
            </p>
          </div>

          <button
            onClick={() => setShowAddToleranceModal(true)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Engineering Tolerance</span>
          </button>
        </div>

        {/* Tolerances Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Parameter Name</th>
                <th className="py-2.5 px-3 font-mono">Unit</th>
                <th className="py-2.5 px-3 font-mono text-right">LSL (Lower)</th>
                <th className="py-2.5 px-3 font-mono text-right">Nominal</th>
                <th className="py-2.5 px-3 font-mono text-right">USL (Upper)</th>
                <th className="py-2.5 px-3 font-mono text-right">Span (USL - LSL)</th>
                <th className="py-2.5 px-3 font-mono text-center">Warning Zone</th>
                <th className="py-2.5 px-3">Metrology Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
              {selectedProduct.tolerances.map((tol, idx) => {
                const span = tol.usl - tol.lsl;
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-sans font-semibold text-slate-900">
                      {tol.parameter}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{tol.unit}</td>
                    <td className="py-3 px-3 text-right text-rose-600 font-medium">
                      {tol.lsl.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-right text-blue-700 font-bold">
                      {tol.nominal.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-600 font-medium">
                      {tol.usl.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-800">
                      ±{(span / 2).toFixed(3)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                        {tol.warningMarginPct || 20}% of band
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-600">
                      {idx === 0 ? 'Zeiss 3D CMM Metrology' : idx === 1 ? 'Laser Interferometer' : 'Profilometer Ra'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Critical-to-Quality Points & Sampling Strategy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Critical-to-Quality (CTQ) Inspection Protocol</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {selectedProduct.criticalToQualityPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-slate-900">
              <Ruler className="w-4 h-4 text-blue-600" />
              <span>Statistical Sampling Governance</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Standard subgroup sizing: <span className="font-semibold text-slate-800 font-mono">n = {selectedProduct.sampleSizePerSubgroup}</span> parts per subgroup drawn at random intervals from each shift. Evaluated under ASTM E2587 control limits with immediate feed hold interlocks if Nelson Rules 1, 2, or 3 are triggered.
            </p>
          </div>
        </div>
      </div>

      {/* Add Tolerance Modal */}
      {showAddToleranceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Add Dimension Specification</h3>
            <form onSubmit={handleAddTolerance} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Parameter Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flange Thickness"
                  value={newParam}
                  onChange={(e) => setNewParam(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nominal</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={newNominal}
                    onChange={(e) => setNewNominal(parseFloat(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Lower Spec Limit (LSL)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={newLsl}
                    onChange={(e) => setNewLsl(parseFloat(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Upper Spec Limit (USL)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={newUsl}
                    onChange={(e) => setNewUsl(parseFloat(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddToleranceModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
                >
                  Save Specification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
