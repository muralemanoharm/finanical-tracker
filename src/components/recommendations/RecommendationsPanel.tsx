import { useFinancialDataContext } from '../../context/FinancialDataContext';
import { useNetWorth } from '../../hooks/useNetWorth';
import { useRecommendations } from '../../hooks/useRecommendations';
import { RecommendationCard } from './RecommendationCard';
import { EmptyState } from '../ui/EmptyState';
import { Sparkles } from 'lucide-react';

export function RecommendationsPanel() {
  const { data, dismissRecommendation, markRecommendationReviewed } = useFinancialDataContext();
  const netWorth = useNetWorth(data);
  const { active } = useRecommendations(data, netWorth);

  if (active.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No recommendations right now"
        description="As you add instruments and data, this engine will surface actionable insights based on your portfolio."
        actionLabel="Got it"
        onAction={() => {}}
      />
    );
  }

  return (
    <div className="space-y-3">
      {active.map((rec) => (
        <RecommendationCard
          key={rec.key}
          recommendation={rec}
          reviewed={data.reviewedRecommendationKeys.includes(rec.key)}
          onMarkReviewed={() => markRecommendationReviewed(rec.key)}
          onDismiss={() => dismissRecommendation(rec.key)}
        />
      ))}
    </div>
  );
}
