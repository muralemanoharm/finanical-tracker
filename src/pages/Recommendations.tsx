import { Header } from '../components/layout/Header';
import { RecommendationsPanel } from '../components/recommendations/RecommendationsPanel';

export default function Recommendations() {
  return (
    <div>
      <Header title="Recommendations" subtitle="Rule-based insights derived from your current data" />
      <div className="px-8 py-6">
        <RecommendationsPanel />
      </div>
    </div>
  );
}
