import type { Recommendation } from '../../types/financial';
import { SeverityBadge } from '../ui/Badge';
import { CheckCircle2, X } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: Recommendation;
  reviewed: boolean;
  onMarkReviewed: () => void;
  onDismiss: () => void;
}

export function RecommendationCard({ recommendation, reviewed, onMarkReviewed, onDismiss }: RecommendationCardProps) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-navy-700 bg-navy-800">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <SeverityBadge severity={recommendation.severity} />
          {reviewed && <span className="text-xs text-emerald-400">Reviewed</span>}
        </div>
        <p className="text-sm text-slate-200">{recommendation.message}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        {!reviewed && (
          <button onClick={onMarkReviewed} className="p-2 rounded-md hover:bg-navy-700 text-slate-400 hover:text-emerald-400" title="Mark as reviewed">
            <CheckCircle2 size={16} />
          </button>
        )}
        <button onClick={onDismiss} className="p-2 rounded-md hover:bg-navy-700 text-slate-400 hover:text-rose-400" title="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
