import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { useFinancialDataContext } from '../context/FinancialDataContext';
import { formatINR, formatDate } from '../utils/formatters';
import { LIFE_COVER_INCOME_MULTIPLE, MIN_HEALTH_COVER_INDIVIDUAL, ULIP_CHARGE_ALERT_THRESHOLD, isWithinNextDays } from '../utils/calculations';
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

  const termPlans = data.lifeInsurance.filter((li) => li.policyType === 'Term');
  const totalTermCover = termPlans.reduce((s, li) => s + li.sumAssured, 0);
  const requiredLifeCover = annualIncome * LIFE_COVER_INCOME_MULTIPLE;
  const lifeAdequate = annualIncome > 0 && totalTermCover >= requiredLifeCover;

  const renewalsSoon = [
    ...data.healthInsurance.map((hi) => ({ name: hi.planName, date: hi.renewalDate, type: 'Health Insurance' })),
    ...data.lifeInsurance.map((li) => ({
      name: li.policyName,
      date: new Date(new Date(li.policyStartDate).setFullYear(new Date(li.policyStartDate).getFullYear() + li.policyTermYears)).toISOString().slice(0, 10),
      type: 'Life Insurance',
    })),
  ].filter((r) => isWithinNextDays(r.date, 90));

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
                ? `Term cover: ${formatINR(totalTermCover)} vs recommended ${formatINR(requiredLifeCover)} (10x annual income)`
                : 'Set your monthly income in Settings to evaluate life cover adequacy.'
            }
          />
        </Card>

        <Card>
          <h3 className="text-white font-medium mb-4">Health Cover Adequacy</h3>
          {data.healthInsurance.length === 0 ? (
            <StatusRow ok={false} label="No health insurance found" detail="Consider adding a health insurance policy with at least ₹10L cover." />
          ) : (
            <div className="space-y-3">
              {data.healthInsurance.map((hi) => (
                <StatusRow
                  key={hi.id}
                  ok={hi.sumInsured >= MIN_HEALTH_COVER_INDIVIDUAL}
                  label={hi.planName}
                  detail={`Sum insured: ${formatINR(hi.sumInsured)} (recommended minimum: ${formatINR(MIN_HEALTH_COVER_INDIVIDUAL)})`}
                />
              ))}
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
                const totalCharges = u.mortalityCharges + u.fundManagementCharges;
                const efficient = totalCharges <= ULIP_CHARGE_ALERT_THRESHOLD;
                return (
                  <StatusRow
                    key={u.id}
                    ok={efficient}
                    label={u.policyName}
                    detail={
                      efficient
                        ? `Charges (${totalCharges.toFixed(2)}%) are within the efficient range.`
                        : `Charges (${totalCharges.toFixed(2)}%) exceed 2.5% — high cost. Consider a term + direct mutual fund combo instead.`
                    }
                  />
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-white font-medium mb-4">Policy Renewals — Next 90 Days</h3>
          {renewalsSoon.length === 0 ? (
            <p className="text-sm text-slate-400">No policies expiring in the next 90 days.</p>
          ) : (
            <div className="space-y-3">
              {renewalsSoon.map((r) => (
                <div key={`${r.type}-${r.name}`} className="flex items-center gap-3 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10">
                  <Clock size={18} className="text-rose-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{r.name}</p>
                    <p className="text-sm text-rose-300">{r.type} — renews/expires {formatDate(r.date)}</p>
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
