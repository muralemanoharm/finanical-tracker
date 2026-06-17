import { useRiskProfile } from '../../hooks/useRiskProfile';
import { RISK_QUESTIONS, computeRiskScore, riskLevelForScore, explanationForLevel } from '../../utils/riskProfile';
import { Card } from '../ui/Card';

export function RiskProfileQuestionnaire() {
  const { data, setAnswer, submit, reset, isComplete, level, targetAllocation } = useRiskProfile();

  const answeredCount = RISK_QUESTIONS.filter((q) => data.answers[q.id] !== undefined).length;
  const allAnswered = answeredCount === RISK_QUESTIONS.length;
  const draftScore = computeRiskScore(data.answers);
  const draftLevel = riskLevelForScore(draftScore);

  return (
    <div>
      <div className="space-y-5">
        {RISK_QUESTIONS.map((q) => (
          <div key={q.id}>
            <p className="text-sm text-slate-300 mb-2">{q.text}</p>
            <div className="flex flex-wrap gap-2">
              {q.options.map((opt) => {
                const selected = data.answers[q.id] === opt.points;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setAnswer(q.id, opt.points)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                      selected ? 'bg-cyan-accent text-navy-950 border-cyan-accent font-medium' : 'bg-navy-700 text-slate-300 border-navy-600 hover:bg-navy-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button
          type="button"
          disabled={!allAnswered}
          onClick={submit}
          className="bg-cyan-accent text-navy-950 font-medium rounded-lg px-5 py-2.5 text-sm hover:bg-cyan-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isComplete ? 'Update Risk Profile' : 'Calculate Risk Profile'}
        </button>
        {isComplete && (
          <button type="button" onClick={reset} className="bg-navy-700 text-slate-200 rounded-lg px-4 py-2.5 text-sm hover:bg-navy-600 transition-colors">
            Reset
          </button>
        )}
        {!allAnswered && <span className="text-xs text-slate-500">{answeredCount} of {RISK_QUESTIONS.length} answered</span>}
      </div>

      {isComplete && level && targetAllocation && (
        <Card className="mt-5 border border-cyan-accent/30">
          <p className="text-sm text-slate-400 mb-1">Your Risk Profile</p>
          <p className="text-xl font-semibold text-cyan-accent mb-2">{level}</p>
          <p className="text-sm text-slate-300">{explanationForLevel(level)}</p>
        </Card>
      )}
      {!isComplete && allAnswered && (
        <p className="text-xs text-slate-500 mt-3">Preview: based on your current answers you'd be classified as {draftLevel}. Click "Calculate Risk Profile" to save it.</p>
      )}
    </div>
  );
}
