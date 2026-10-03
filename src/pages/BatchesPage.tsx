import React, { useState } from 'react';
import { ProductionBatch } from '../types';
import { EpistemicBadge } from '../components/EpistemicBadge';
import {
  Boxes,
  Lock,
  CheckCircle2,
  AlertCircle,
  FileSignature,
  Clock,
  User,
  Filter,
  Search,
  Plus,
  Sliders,
  Calendar,
  Layers,
  X,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface Props {
  batches: ProductionBatch[];
  onCreateBatch?: (batch: Partial<ProductionBatch>) => void;
  onOpenApprovalModal: (title: string, entityType: any, entityId: string, defaultDecision?: any, defaultNotes?: string) => void;
}

export const BatchesPage: React.FC<Props> = ({
  batches,
  onCreateBatch,
  onOpenApprovalModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMachine, setFilterMachine] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for creating a new batch
  const [newBatchId, setNewBatchId] = useState(`LOT-2026-PROD-${Math.floor(10 + Math.random() * 90)}`);
  const [newProduct, setNewProduct] = useState('Aerospace High-Pressure Turbine Spindle Housing');
  const [newPartNumber, setNewPartNumber] = useState('PRD-AERO-701');
  const [newMachine, setNewMachine] = useState('CNC Line A-1 (Mori Seiki 5-Axis)');
  const [newMaterial, setNewMaterial] = useState('Inconel 718 Superalloy');
  const [newShift, setNewShift] = useState('Shift 1 (Day 06:00 - 14:00)');
  const [newQuantity, setNewQuantity] = useState(150);
  const [newStart, setNewStart] = useState('2026-10-03T06:00');
  const [newEnd, setNewEnd] = useState('2026-10-03T14:30');
  const [newStatus, setNewStatus] = useState<ProductionBatch['status']>('ACTIVE');

  // List of machines for filtering
  const machineList = [
    'ALL',
    'CNC Line A-1 (Mori Seiki 5-Axis)',
    'Micro-EDM Cell B-3',
    'Cellular Cleanroom Line D-2',
    'High-Speed Grinding Cell C-4',
  ];

  // List of statuses for filtering
  const statusList = ['ALL', 'ACTIVE', 'PASSED', 'WARNING', 'QUARANTINED', 'COMPLETED'];

  // Filter & Search logic
  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.operatorId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMachine = filterMachine === 'ALL' || b.lineId === filterMachine;
    const matchesStatus = filterStatus === 'ALL' || b.status === filterStatus;

    return matchesSearch && matchesMachine && matchesStatus;
  });

  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || filteredBatches[0] || batches[0];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchId || !newProduct) return;

    if (onCreateBatch) {
      onCreateBatch({
        batchNumber: newBatchId,
        productName: newProduct,
        productCode: newPartNumber,
        lineId: newMachine,
        material: newMaterial,
        shift: newShift,
        totalUnits: Number(newQuantity),
        inspectedUnits: 0,
        passedUnits: 0,
        quarantinedUnits: 0,
        defectCount: 0,
        yieldPercentage: 100,
        startTime: newStart,
        endTime: newEnd,
        status: newStatus,
        operatorId: 'OP-442 (K. Vance)',
      });
    }

    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Production Batches & Traceability Registry</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 font-semibold">
              AS9100 / IATF 16949
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full lot traceability, machine allocation, material tracking, and quality release sign-offs.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Production Batch</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Batch ID, Product, Part #, Material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Machine Filter */}
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 font-medium">Machine:</span>
            <select
              value={filterMachine}
              onChange={(e) => setFilterMachine(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 focus:outline-hidden cursor-pointer"
            >
              {machineList.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600 font-medium">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 bg-slate-50 focus:outline-hidden cursor-pointer"
            >
              {statusList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid: Batches Table (7 cols) + Selected Batch Details (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Batches Table */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-xs text-slate-900">
              Batches Registered ({filteredBatches.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Lot Tracking Active</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Batch ID / Product</th>
                  <th className="py-2.5 px-3">Machine &amp; Material</th>
                  <th className="py-2.5 px-3 font-mono text-center">Shift</th>
                  <th className="py-2.5 px-3 font-mono text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                      No matching production batches found.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => {
                    const isSelected = b.id === selectedBatchId;
                    return (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedBatchId(b.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/70 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 font-mono">{b.batchNumber}</div>
                          <div className="text-[11px] text-slate-600 font-sans truncate max-w-[170px]">
                            {b.productName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">Part #{b.productCode}</div>
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <div className="text-slate-800 font-medium truncate max-w-[150px]">{b.lineId}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{b.material}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-sans text-[11px]">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {b.shift.split(' ')[0]} {b.shift.split(' ')[1]}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-bold text-slate-900">{b.totalUnits} pcs</span>
                          <div className="text-[10px] text-slate-400">{b.inspectedUnits} inspected</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded ${
                              b.status === 'QUARANTINED'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : b.status === 'PASSED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : b.status === 'COMPLETED'
                                ? 'bg-slate-100 text-slate-800 border border-slate-300'
                                : 'bg-blue-100 text-blue-800 border border-blue-300'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-sans">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBatchId(b.id);
                            }}
                            className="px-2 py-1 text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-800 rounded border border-slate-300 transition-colors"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Batch Details Drawer / Panel */}
        {selectedBatch && (
          <div className="lg:col-span-5 bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Batch Details</span>
                <h3 className="text-base font-bold text-slate-900 font-mono">{selectedBatch.batchNumber}</h3>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded ${
                  selectedBatch.status === 'QUARANTINED'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : selectedBatch.status === 'PASSED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}
              >
                {selectedBatch.status}
              </span>
            </div>

            {/* 10 Required Batch Fields Presentation */}
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">1. BATCH ID</span>
                    <span className="font-mono font-bold text-slate-900">{selectedBatch.batchNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">2. PART NUMBER</span>
                    <span className="font-mono font-bold text-blue-700">{selectedBatch.productCode}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] block font-mono">3. PRODUCT NAME</span>
                  <span className="font-semibold text-slate-900">{selectedBatch.productName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">4. MACHINE ALLOCATED</span>
                    <span className="font-medium text-slate-800">{selectedBatch.lineId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">5. MATERIAL SPECIFICATION</span>
                    <span className="font-medium text-slate-800">{selectedBatch.material}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">6. PRODUCTION SHIFT</span>
                    <span className="font-medium text-slate-800">{selectedBatch.shift}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-mono">7. TOTAL QUANTITY</span>
                    <span className="font-mono font-bold text-slate-900">{selectedBatch.totalUnits} pcs</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">8. PRODUCTION START</span>
                    <span className="text-slate-700 text-[11px]">{selectedBatch.startTime.replace('T', ' ').substring(0, 16)} UTC</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">9. PRODUCTION END</span>
                    <span className="text-slate-700 text-[11px]">
                      {selectedBatch.endTime ? selectedBatch.endTime.replace('T', ' ').substring(0, 16) + ' UTC' : 'In Production'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quality & Yield Bar */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Inspection &amp; Yield Metrics:</span>
                  <span className={`font-mono font-bold ${selectedBatch.yieldPercentage < 90 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {selectedBatch.yieldPercentage.toFixed(1)}% First Pass Yield
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                  <div
                    className="bg-emerald-600 h-2.5"
                    style={{ width: `${selectedBatch.yieldPercentage}%` }}
                  ></div>
                  <div
                    className="bg-rose-500 h-2.5"
                    style={{ width: `${100 - selectedBatch.yieldPercentage}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Passed: {selectedBatch.passedUnits} pcs</span>
                  <span className="text-rose-600 font-bold">Nonconforming: {selectedBatch.quarantinedUnits} pcs</span>
                  <span>Inspected: {selectedBatch.inspectedUnits}/{selectedBatch.totalUnits}</span>
                </div>
              </div>

              {/* Human Sign-Off / Quarantine Audit Lock */}
              <div className="border border-slate-200 rounded-lg p-3 space-y-2 bg-white">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <FileSignature className="w-3.5 h-3.5 text-blue-600" />
                    <span>Human Quality-Engineer Sign-off Gate</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">ISO 9001 §8.7</span>
                </div>

                {selectedBatch.humanSignOff ? (
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{selectedBatch.humanSignOff.approvedBy}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {selectedBatch.humanSignOff.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {selectedBatch.humanSignOff.role} · {selectedBatch.humanSignOff.timestamp.substring(0, 16)} UTC
                    </div>
                    <p className="text-slate-700 text-[11px] pt-1 leading-relaxed">
                      "{selectedBatch.humanSignOff.notes}"
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                    <p>
                      No formal human sign-off recorded. Quality Engineer signature is required to release or quarantine this batch.
                    </p>
                  </div>
                )}

                <button
                  onClick={() =>
                    onOpenApprovalModal(
                      `Batch Disposition: ${selectedBatch.batchNumber}`,
                      'BATCH',
                      selectedBatch.id,
                      selectedBatch.status === 'QUARANTINED' ? 'APPROVED' : 'QUARANTINED',
                      `Formal engineering disposition for ${selectedBatch.productName} (Lot ${selectedBatch.batchNumber}).`
                    )
                  }
                  className="w-full py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Execute Engineer Disposition Sign-Off</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-sm">Create New Production Batch</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Batch ID *</label>
                  <input
                    type="text"
                    required
                    value={newBatchId}
                    onChange={(e) => setNewBatchId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Part Number *</label>
                  <input
                    type="text"
                    required
                    value={newPartNumber}
                    onChange={(e) => setNewPartNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Product Description *</label>
                <input
                  type="text"
                  required
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Assigned Machine *</label>
                  <select
                    value={newMachine}
                    onChange={(e) => setNewMachine(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  >
                    <option value="CNC Line A-1 (Mori Seiki 5-Axis)">CNC Line A-1 (Mori Seiki 5-Axis)</option>
                    <option value="Micro-EDM Cell B-3">Micro-EDM Cell B-3</option>
                    <option value="Cellular Cleanroom Line D-2">Cellular Cleanroom Line D-2</option>
                    <option value="High-Speed Grinding Cell C-4">High-Speed Grinding Cell C-4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Material Specification *</label>
                  <input
                    type="text"
                    required
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Production Shift *</label>
                  <select
                    value={newShift}
                    onChange={(e) => setNewShift(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  >
                    <option value="Shift 1 (Day 06:00 - 14:00)">Shift 1 (Day 06:00 - 14:00)</option>
                    <option value="Shift 2 (Swing 14:00 - 22:00)">Shift 2 (Swing 14:00 - 22:00)</option>
                    <option value="Shift 3 (Night 22:00 - 06:00)">Shift 3 (Night 22:00 - 06:00)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Lot Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Production Start *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Production End</label>
                  <input
                    type="datetime-local"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Initial Status</label>
                <select
                  value={newStatus}
                  onChange={(e: any) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                >
                  <option value="ACTIVE">ACTIVE (In Production)</option>
                  <option value="PASSED">PASSED (Completed &amp; Released)</option>
                  <option value="WARNING">WARNING (Under Investigation)</option>
                  <option value="QUARANTINED">QUARANTINED (Hold Cage A-14)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded border border-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold flex items-center gap-1.5"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Register Batch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
