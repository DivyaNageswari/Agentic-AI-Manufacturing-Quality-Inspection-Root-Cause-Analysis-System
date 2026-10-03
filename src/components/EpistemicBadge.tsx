import React from 'react';
import { EpistemicType } from '../types';
import { FileText, Eye, BarChart2, HelpCircle, CheckCircle2, UserCheck } from 'lucide-react';

interface Props {
  type: EpistemicType;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const EpistemicBadge: React.FC<Props> = ({
  type,
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  const configs: Record<
    EpistemicType,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode; desc: string }
  > = {
    OBSERVED_FACT: {
      label: 'Observed Fact',
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-300',
      icon: <FileText className="w-3.5 h-3.5 text-slate-600" />,
      desc: 'Direct empirical measurement from CMM probe, calibrated gauge, or sensor log.',
    },
    MODEL_PREDICTION: {
      label: 'Model Prediction',
      bg: 'bg-indigo-50',
      text: 'text-indigo-800',
      border: 'border-indigo-200',
      icon: <Eye className="w-3.5 h-3.5 text-indigo-600" />,
      desc: 'Inferred by computer vision CNN or ML classifier. Probabilistic, requires verification.',
    },
    STATISTICAL_FINDING: {
      label: 'Statistical Finding',
      bg: 'bg-cyan-50',
      text: 'text-cyan-900',
      border: 'border-cyan-200',
      icon: <BarChart2 className="w-3.5 h-3.5 text-cyan-700" />,
      desc: 'Calculated via deterministic mathematical formulas (SPC, Nelson Rules, Cpk, Mahalanobis).',
    },
    RCA_HYPOTHESIS: {
      label: 'RCA Hypothesis',
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      border: 'border-amber-300',
      icon: <HelpCircle className="w-3.5 h-3.5 text-amber-700" />,
      desc: 'Synthesized potential cause by AI reasoning. Unconfirmed until physical test.',
    },
    CONFIRMED_ROOT_CAUSE: {
      label: 'Confirmed Root Cause',
      bg: 'bg-emerald-50',
      text: 'text-emerald-900',
      border: 'border-emerald-300',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />,
      desc: 'Physically tested, verified, and signed off by Human Quality Engineer.',
    },
    HUMAN_DECISION: {
      label: 'Human Decision',
      bg: 'bg-purple-50',
      text: 'text-purple-900',
      border: 'border-purple-300',
      icon: <UserCheck className="w-3.5 h-3.5 text-purple-700" />,
      desc: 'Authorized engineering disposition, sign-off, or gate approval applied by a certified Quality Engineer.',
    },
  };

  const c = configs[type] || configs.OBSERVED_FACT;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  }[size];

  return (
    <span
      title={`${c.label}: ${c.desc}`}
      className={`inline-flex items-center font-medium rounded border ${c.bg} ${c.text} ${c.border} ${sizeClasses} ${className}`}
    >
      {showIcon && c.icon}
      <span>{c.label}</span>
    </span>
  );
};
