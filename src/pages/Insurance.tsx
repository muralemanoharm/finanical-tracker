import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { useFinancialDataContext } from '../context/FinancialDataContext';
import { useCashFlow } from '../hooks/useCashFlow';
import { formatINR, formatDate, formatPercent } from '../utils/formatters';
import {
  LIFE_COVER_INCOME_MULTIPLE,
  LIFE_COVER_EXPENSE_MULTIPLE,
  MIN_HEALTH_COVER_INDIVIDUAL,
  MIN_HEALTH_COVER_FAMILY,
  MEDICAL_INFLATION_RATE,
  ULIP_NET_RETURN_ALERT_THRESHOLD,
  INSURANCE_PREMIUM_INCOME_ALERT_PERCENT,
  ulipEffectiveReturn,
  ulipBreakEvenYear,
  isWithinNextDays,
  monthsBetween,
  todayISO,
} from '../utils/calculations';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

function StatusRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${ok ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'}`}>
      {ok ? <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 shrink-0" /> : <AlertTriangle size={18} className="text-rose-400 mt-0.5 shrink-0" />}
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-sm text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

export default function Insurance() {
  const { data } = useFinancialDataContext();
  const annualIncome = data.profile.monthlyIncome * 12;
  const cashFlow = useCashFlow(data);
  const annualExpenses = cashFlow.totalExpenses * 12;

  // --- Life Cover Check ---
  const totalLifeCover = data.lifeInsurance.reduce((s, li) => s + li.sumAssured, 0);
  const nonTermCover = data.lifeInsurance.filter((li) => li.policyType !== 'Term').reduce((s, li) => s + li.sumAssured, 0);
  const outstandingLoans = data.liabilities.reduce((s, l) => s + l.outstandingPrincipal, 0);
  const requiredLifeCover = annualIncome * LIFE_COVER_INCOME_MULTIPLE + outstandingLoans + annualExpenses * LIFE_COVER_EXPENSE_MULTIPLE;
  const lifeAdequate = annualIncome > 0 && totalLifeCover >= requiredLifeCover;

  // --- Premium Cash Flow Check ---
  const totalAnnualPremium =
    data.lifeInsurance.reduce((s, li) => s + li.annualPremium, 0) +
    data.healthInsurance.reduce((s, hi) => s + hi.annualPremium, 0) +
    data.ulips.reduce((s, u) => s + u.annualPremium, 0);
  const premiumPercentOfIncome = annualIncome > 0 ? (totalAnnualPremium / annualIncome) * 100 : 0;
  const overInsured = premiumPercentOfIncome > INSURANCE_PREMIUM_INCOME_ALERT_PERCENT;

  // --- Renewals (orange for health, red for life) ---
  const healthRenewalsSoon = data.healthInsurance.filter((hi) => isWithinNextDays(hi.renewalDate, 90));
  const lifeRenewalsSoon = data.lifeInsurance
    .map((li) => ({ ...li, expiryDate: new Date(new Date(li.policyStartDate).setFullYear(new Date(li.policyStartDate).getFullYear() + li.policyTermYears)).toISOString().slice(0, 10) }))
    .filter((li) => isWithinNextDays(li.expiryDate, 90));

  return (
    <div>
      <Header title="Insurance Health Panel" subtitle="Coverage adequacy checks and renewal reminders" />
      <div className="px-8 py-6 space-y-6">
        <Card>
          <h3 className="text-white font-medium mb-4">Life Cover Adequacy</h3>
          <StatusRow
            ok={lifeAdequate}
            label={lifeAdequate ? 'Life cover looks adequate' : 'Life cover is below recommended level'}
            detail={
              annualIncome > 0
                ? `Total cover: ${formatINR(totalLifeCover)} vs recommended ${formatINR(requiredLifeCover)} (10x income + ${formatINR(outstandingLoans)} loans + 5x annual expenses)`
                : 'Set your monthly income in Settings to evaluate life cover adequacy.'
            }
          />
          {nonTermCover > 0 && (
            <p className="text-sm text-amber-400 mt-3">
              {formatINR(nonTermCover)} of your cover comes from Endowment/Money-back policies — a pure term plan offers the same cover at a fraction of
              the premium. Consider supplementing with term cover instead.
            </p>
          )}
        </Card>

        <Card>
          <h3 className="text-white font-medium mb-4">Health Cover Adequacy</h3>
          {data.healthInsurance.length === 0 ? (
            <StatusRow ok={false} label="No health insurance found" detail="Consider adding a health insurance policy with at least ₹10L cover." />
          ) : (
            <div className="space-y-3">
              {data.healthInsurance.map((hi) => {
                const minCover = hi.coverageType === 'Family Floater' ? MIN_HEALTH_COVER_FAMILY : MIN_HEALTH_COVER_INDIVIDUAL;
                const erodedIn10Years = hi.sumInsured / Math.pow(1 + MEDICAL_INFLATION_RATE / 100, 10);
                return (
                  <div key={hi.id}>
                    <StatusRow
                      ok={hi.sumInsured >= minCover}
                      label={hi.planName}
                      detail={`Sum insured: ${formatINR(hi.sumInsured)} (recommended minimum for ${hi.coverageType}: ${formatINR(minCover)})`}
                    />
                    <p className="text-xs text-slate-500 mt-1.5 ml-1">
                      At {MEDICAL_INFLATION_RATE}% medical inflation, your {formatINR(hi.sumInsured)} cover in 10 years will feel like only{' '}
                      {formatINR(erodedIn10Years)} in today's purchasing power.
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-white font-medium mb-4">ULIP Efficiency</h3>
          {data.ulips.length === 0 ? (
            <p className="text-sm text-slate-400">No ULIPs tracked.</p>
          ) : (
            <div className="space-y-3">
              {data.ulips.map((u) => {
                const netReturn = ulipEffectiveReturn(u.expectedReturn, u.mortalityCharges, u.fundManagementCharges);
                const efficient = netReturn >= ULIP_NET_RETURN_ALERT_THRESHOLD;
                const yearsElapsedSoFar = Math.max(0, monthsBetween(u.policyStartDate, todayISO()) / 12);
                const breakEvenYears = ulipBreakEvenYear(u.currentFundValue, u.expectedReturn, u.mortalityCharges, u.fundManagementCharges, u.annualPremium, yearsElapsedSoFar);
                return (
                  <div key={u.id}>
                    <StatusRow
                      ok={efficient}
                      label={u.policyName}
                      detail={
                        efficient
                          ? `Net return after charges: ${formatPercent(netReturn)} — efficient.`
                          : `Net return after charges: ${formatPercent(netReturn)} — below ${ULIP_NET_RETURN_ALERT_THRESHOLD}%. Consider a term + direct mutual fund combo instead.`
                      }
                    />
                    <p className="text-xs text-slate-500 mt-1.5 ml-1">
                      {breakEvenYears === null
                        ? 'Fund value is not projected to exceed cumulative premiums paid within 30 years.'
                        : breakEvenYears === 0
                          ? 'Fund value has already exceeded cumulative premiums paid.'
                          : `Break-even (fund value exceeds cumulative premiums paid) projected in ~${breakEvenYears} year(s).`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-white font-medium mb-4">Premium Cash Flow</h3>
          <StatusRow
            ok={!overInsured}
            label={overInsured ? 'Over-insured on premium spend' : 'Insurance premium spend is within a healthy range'}
            detail={`Total annual premium outflow: ${formatINR(totalAnnualPremium)} (${formatPercent(premiumPercentOfIncome)} of annual income, recommended under ${INSURANCE_PREMIUM_INCOME_ALERT_PERCENT}%)`}
          />
        </Card>

        <Card>
          <h3 className="text-white font-medium mb-4">Policy Renewals — Next 90 Days</h3>
          {healthRenewalsSoon.length === 0 && lifeRenewalsSoon.length === 0 ? (
            <p className="text-sm text-slate-400">No policies expiring in the next 90 days.</p>
          ) : (
            <div className="space-y-3">
              {healthRenewalsSoon.map((hi) => (
                <div key={hi.id} className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
                  <Clock size={18} className="text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{hi.planName}</p>
                    <p className="text-sm text-amber-300">Health Insurance — renews {formatDate(hi.renewalDate)}</p>
                  </div>
                </div>
              ))}
              {lifeRenewalsSoon.map((li) => (
                <div key={li.id} className="flex items-center gap-3 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10">
                  <Clock size={18} className="text-rose-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{li.policyName}</p>
                    <p className="text-sm text-rose-300">Life Insurance — expires {formatDate(li.expiryDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
