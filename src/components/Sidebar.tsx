import React from 'react';
import {
  LayoutDashboard,
  Sliders,
  Boxes,
  CheckSquare,
  Eye,
  Activity,
  TrendingUp,
  AlertTriangle,
  GitFork,
  ShieldCheck,
  Cpu,
  FileText,
  CircleDot,
  FlaskConical,
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'agent-workflow'
  | 'product-config'
  | 'batches'
  | 'inspection-center'
  | 'visual-inspection'
  | 'process-monitoring'
  | 'spc-dashboard'
  | 'incidents'
  | 'rca'
  | 'capa'
  | 'ai-review'
  | 'reports'
  | 'test-results';

interface Props {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  counts: {
    incidents: number;
    quarantinedBatches: number;
    pendingCapa: number;
    spcViolations: number;
  };
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<Props> = ({
  currentPage,
  onNavigate,
  counts,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems: Array<{
    id: PageId;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'product-config', label: 'Products', icon: <Sliders className="w-4 h-4" /> },
    { id: 'batches', label: 'Batches', icon: <Boxes className="w-4 h-4" />, badge: counts.quarantinedBatches, badgeColor: 'bg-amber-500 text-white' },
    { id: 'inspection-center', label: 'Inspection', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'visual-inspection', label: 'Visual Inspection', icon: <Eye className="w-4 h-4" /> },
    { id: 'process-monitoring', label: 'Process Monitoring', icon: <Activity className="w-4 h-4" /> },
    { id: 'spc-dashboard', label: 'SPC', icon: <TrendingUp className="w-4 h-4" />, badge: counts.spcViolations > 0 ? counts.spcViolations : undefined, badgeColor: 'bg-rose-500 text-white' },
    { id: 'incidents', label: 'Quality Incidents', icon: <AlertTriangle className="w-4 h-4" />, badge: counts.incidents, badgeColor: 'bg-rose-600 text-white' },
    { id: 'rca', label: 'RCA', icon: <GitFork className="w-4 h-4" /> },
    { id: 'capa', label: 'CAPA', icon: <ShieldCheck className="w-4 h-4" />, badge: counts.pendingCapa, badgeColor: 'bg-blue-600 text-white' },
    { id: 'ai-review', label: 'AI Review', icon: <Cpu className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'test-results', label: 'Test Results', icon: <FlaskConical className="w-4 h-4 text-emerald-400" />, badge: 8, badgeColor: 'bg-emerald-700 text-white' },
  ];

  const handleItemClick = (id: PageId) => {
    onNavigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 z-30 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`w-64 bg-slate-950 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-57px)] fixed md:relative z-40 transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Navigation Links */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
            System Modules
          </div>

          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      item.badgeColor || 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Agent Orchestrator Status Pill */}
        <button
          onClick={() => handleItemClick('agent-workflow')}
          className="p-3 border-t border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-colors text-left w-full group cursor-pointer"
          title="Open Multi-Agent Workflow Orchestrator"
        >
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2 group-hover:text-slate-200">
            <span className="flex items-center gap-1.5">
              <CircleDot className="w-3 h-3 text-emerald-400" />
              <span>Agent Orchestrator</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">8 / 8 Active</span>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 font-mono group-hover:text-slate-300">
            <span className="truncate">· Data Intake</span>
            <span className="truncate">· Vision CNN</span>
            <span className="truncate">· Metrology</span>
            <span className="truncate">· Anomaly Det</span>
            <span className="truncate">· SPC Engine</span>
            <span className="truncate">· RCA 5-Whys</span>
            <span className="truncate">· CAPA Synth</span>
            <span className="truncate">· Critic Audit</span>
          </div>
        </button>
      </aside>
    </>
  );
};
