import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card, KpiCard } from '../components/ui/Card';
import { Field, Input } from '../components/ui/FormField';
import { DataTable, type Column } from '../components/ui/DataTable';
import { Drawer } from '../components/ui/Drawer';
import { EmptyState } from '../components/ui/EmptyState';
import { AddIncomeStreamForm } from '../components/forms/AddIncomeStreamForm';
import { AddSkillForm } from '../components/forms/AddSkillForm';
import { JobSwitchWealthChart } from '../components/charts/JobSwitchWealthChart';
import { IncomeStreamChart } from '../components/charts/IncomeStreamChart';
import { useFinancialDataContext } from '../context/FinancialDataContext';
import { useCareerDataContext } from '../context/CareerDataContext';
import { useNetWorth } from '../hooks/useNetWorth';
import {
  humanCapitalValue,
  humanCapitalDecayPerYear,
  computeJobSwitchProjection,
  incomeStreamSeries,
  monthsToReachTarget,
  dateToReachTarget,
  incomeThisFinancialYear,
  cumulativeIncomeSinceStart,
  combinedSideIncomeAt,
  fiFromJobDate,
  skillRoiPercent,
  skillPaybackMonths,
  totalSkillInvestmentThisYear,
  totalRealizedSalaryImpact,
} from '../utils/careerCalculations';
import { formatINR, formatINRCompact, formatPercent, formatDate } from '../utils/formatters';
import type { IncomeStream, SkillInvestment } from '../types/career';

const CAREER_START_AGE = 22;

function HumanCapitalSection() {
  const { data: careerData, updateHumanCapitalInputs } = useCareerDataContext();
  const { data } = useFinancialDataContext();
  const netWorth = useNetWorth(data);
  const hc = careerData.humanCapital;

  const hcValue = useMemo(() => humanCapitalValue(hc), [hc]);
  const decayPerYear = useMemo(() => humanCapitalDecayPerYear(hc), [hc]);
  const workingYearsLeft = Math.max(0, hc.retirementAge - hc.currentAge);
  const totalWealth = hcValue + netWorth.netWorth;
  const hcShareOfWealth = totalWealth > 0 ? (hcValue / totalWealth) * 100 : 0;

  const setField = (key: keyof typeof hc) => (e: React.ChangeEvent<HTMLInputElement>) =>
    updateHumanCapitalInputs({ [key]: parseFloat(e.target.value) || 0 });

  return (
    <Card>
      <h3 className="text-white font-medium mb-1">Human Capital Calculator</h3>
      <p className="text-xs text-slate-500 mb-4">The present value of all your future salary — your biggest asset, long before your portfolio catches up.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Field label="Current Annual CTC (₹)">
            <Input type="number" value={hc.currentAnnualCTC || ''} onChange={setField('currentAnnualCTC')} />
          </Field>
          <Field label="Salary Growth Rate (% per year)">
            <Input type="number" step="0.1" value={hc.salaryGrowthPercent || ''} onChange={setField('salaryGrowthPercent')} />
          </Field>
          <Field label="Discount Rate (% per year)">
            <Input type="number" step="0.1" value={hc.discountRatePercent || ''} onChange={setField('discountRatePercent')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Current Age">
              <Input type="number" value={hc.currentAge || ''} onChange={setField('currentAge')} />
            </Field>
            <Field label="Retirement Age">
              <Input type="number" value={hc.retirementAge || ''} onChange={setField('retirementAge')} />
            </Field>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-1">Human Capital (PV of future earnings)</p>
            <p className="text-3xl font-bold text-white">{formatINR(hcValue)}</p>
            <p className="text-sm text-slate-400 mt-1">{formatINRCompact(hcValue)}</p>
          </div>
          <div>
            <p className="text-sm text-cyan-accent font-medium">
              Your career is {formatPercent(hcShareOfWealth, 0)} of your total wealth ({formatINRCompact(totalWealth)} combined)
            </p>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-300">Human Capital Decay</span>
              <span className="text-slate-400">{workingYearsLeft} working years left</span>
            </div>
            <div className="h-2 rounded-full bg-navy-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-accent"
                style={{ width: `${Math.max(0, Math.min(100, (workingYearsLeft / Math.max(1, hc.retirementAge - CAREER_START_AGE)) * 100))}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Each year of delay costs you ~{formatINRCompact(decayPerYear)} in lifetime earnings.</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function JobSwitchSection() {
  const { data: careerData, updateJobSwitchInputs } = useCareerDataContext();
  const js = careerData.jobSwitch;

  const rows = useMemo(() => computeJobSwitchProjection(js), [js]);
  const lastRow = rows[rows.length - 1];
  const headlineDelta = lastRow ? lastRow.wealthTarget - lastRow.wealthCurrent : 0;

  const setField = (key: keyof typeof js) => (e: React.ChangeEvent<HTMLInputElement>) =>
    updateJobSwitchInputs({ [key]: parseFloat(e.target.value) || 0 });

  const columns: Column<(typeof rows)[number]>[] = [
    { header: 'Year', render: (r) => r.year },
    { header: 'Current Job Salary', render: (r) => formatINR(r.currentSalary) },
    { header: 'Target Job Salary', render: (r) => formatINR(r.targetSalary) },
    { header: 'Cumulative Income Diff', render: (r) => formatINR(r.cumulativeTargetIncome - r.cumulativeCurrentIncome) },
    { header: 'Cumulative Wealth Diff', render: (r) => formatINR(r.wealthTarget - r.wealthCurrent) },
  ];

  return (
    <Card>
      <h3 className="text-white font-medium mb-1">Job Switch Value Calculator</h3>
      <p className="text-xs text-slate-500 mb-4">Compare staying put vs switching, assuming the salary gap gets invested.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Field label="Current CTC (₹/year)">
          <Input type="number" value={js.currentCTC || ''} onChange={setField('currentCTC')} />
        </Field>
        <Field label="Target CTC (₹/year)">
          <Input type="number" value={js.targetCTC || ''} onChange={setField('targetCTC')} />
        </Field>
        <Field label="Current Job Growth (%/year)">
          <Input type="number" step="0.1" value={js.currentGrowthPercent || ''} onChange={setField('currentGrowthPercent')} />
        </Field>
        <Field label="Target Job Growth (%/year)">
          <Input type="number" step="0.1" value={js.targetGrowthPercent || ''} onChange={setField('targetGrowthPercent')} />
        </Field>
        <Field label="Investment Rate on Surplus (%/year)">
          <Input type="number" step="0.1" value={js.investmentRatePercent || ''} onChange={setField('investmentRatePercent')} />
        </Field>
        <Field label={`Years to Compare: ${js.yearsToCompare}`}>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={js.yearsToCompare}
            onChange={(e) => updateJobSwitchInputs({ yearsToCompare: parseInt(e.target.value, 10) })}
            className="w-full accent-cyan-400"
          />
        </Field>
      </div>

      <div className="bg-navy-700/50 rounded-lg p-4 mb-4">
        <p className={`text-sm font-medium ${headlineDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {headlineDelta >= 0 ? 'Switching now' : 'Staying put'} puts {formatINRCompact(Math.abs(headlineDelta))}{' '}
          {headlineDelta >= 0 ? 'more' : 'less'} in your pocket over {js.yearsToCompare} year{js.yearsToCompare > 1 ? 's' : ''}.
        </p>
      </div>

      <div className="mb-4">
        <JobSwitchWealthChart rows={rows} />
      </div>

      {rows.length > 0 && <DataTable rows={rows} columns={columns} keyFor={(r) => String(r.year)} />}
    </Card>
  );
}

function IncomeStreamsSection() {
  const { data } = useFinancialDataContext();
  const { data: careerData, addIncomeStream, updateIncomeStream, deleteIncomeStream } = useCareerDataContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeStream | null>(null);
  const streams = careerData.incomeStreams;

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (s: IncomeStream) => {
    setEditing(s);
    setDrawerOpen(true);
  };
  const handleSubmit = (values: Omit<IncomeStream, 'id'>) => {
    if (editing) updateIncomeStream(editing.id, values);
    else addIncomeStream(values);
    setDrawerOpen(false);
  };

  const totalSideIncome = useMemo(() => combinedSideIncomeAt(streams, 0), [streams]);
  const totalActiveIncome = data.profile.monthlyIncome + totalSideIncome;
  const sideIncomeSharePercent = totalActiveIncome > 0 ? (totalSideIncome / totalActiveIncome) * 100 : 0;
  const monthlyExpense = data.profile.monthlyExpenseTarget;
  const monthsOfExpensesCovered = monthlyExpense > 0 ? totalSideIncome / monthlyExpense : 0;
  const fiDate = useMemo(() => fiFromJobDate(streams, monthlyExpense), [streams, monthlyExpense]);

  return (
    <Card>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-medium mb-1">Side Project / Freelance Income Tracker</h3>
          <p className="text-xs text-slate-500">Track every income stream outside your day job.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-cyan-accent text-navy-950 font-medium rounded-lg px-4 py-2 text-sm hover:bg-cyan-300 transition-colors">
          <Plus size={16} /> Add Stream
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <KpiCard label="Total Active Income (₹/mo)" value={formatINR(totalActiveIncome)} />
        <KpiCard label="Side Income % of Total" value={formatPercent(sideIncomeSharePercent)} accent={sideIncomeSharePercent > 0 ? 'positive' : 'neutral'} />
        <KpiCard label="Side Income Covers" value={`${monthsOfExpensesCovered.toFixed(1)} months of expenses`} />
      </div>
      {fiDate && (
        <p className="text-sm text-emerald-400 font-medium mb-5">Financial Independence from your job is possible by {formatDate(fiDate, 'MMM yyyy')}, at current growth rates.</p>
      )}

      {streams.length === 0 ? (
        <EmptyState icon={Briefcase} title="No income streams yet" description="Add a side project or freelance stream to track its growth toward independence." actionLabel="Add your first stream" onAction={openAdd} />
      ) : (
        <div className="space-y-5">
          {streams.map((s) => {
            const series = incomeStreamSeries(s);
            const months = monthsToReachTarget(s);
            const reachDate = dateToReachTarget(s);
            return (
              <div key={s.id} className="border border-navy-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-white font-medium">{s.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatINR(s.monthlyIncomeCurrent)}/mo now · target {formatINR(s.targetMonthlyIncome)}/mo · growing {formatPercent(s.growthRatePercentPerMonth)}/mo
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-md hover:bg-navy-700 text-slate-400 hover:text-white">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => deleteIncomeStream(s.id)} className="p-1.5 rounded-md hover:bg-rose-500/15 text-slate-400 hover:text-rose-400">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-slate-500 text-xs">Annual Income This FY</p>
                    <p className="text-slate-200">{formatINR(incomeThisFinancialYear(s))}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Cumulative Since Start</p>
                    <p className="text-slate-200">{formatINR(cumulativeIncomeSinceStart(s))}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">Reaches Target</p>
                    <p className="text-slate-200">{months === null ? 'Not at current growth' : reachDate ? formatDate(reachDate, 'MMM yyyy') : 'Already reached'}</p>
                  </div>
                </div>
                <IncomeStreamChart points={series} />
              </div>
            );
          })}
        </div>
      )}

      <Drawer open={drawerOpen} title={editing ? 'Edit Income Stream' : 'Add Income Stream'} onClose={() => setDrawerOpen(false)}>
        <AddIncomeStreamForm initial={editing || undefined} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} />
      </Drawer>
    </Card>
  );
}

function SkillsSection() {
  const { data: careerData, addSkill, updateSkill, deleteSkill } = useCareerDataContext();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<SkillInvestment | null>(null);
  const skills = careerData.skills;

  const openAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (s: SkillInvestment) => {
    setEditing(s);
    setDrawerOpen(true);
  };
  const handleSubmit = (values: Omit<SkillInvestment, 'id' | 'createdAt'>) => {
    if (editing) updateSkill(editing.id, values);
    else addSkill(values);
    setDrawerOpen(false);
  };

  const totalThisYear = totalSkillInvestmentThisYear(skills);
  const realizedImpact = totalRealizedSalaryImpact(skills);

  const columns: Column<SkillInvestment>[] = [
    { header: 'Skill', render: (s) => <span className="font-medium text-white">{s.name}</span> },
    { header: 'Cost', render: (s) => formatINR(s.cost) },
    { header: 'Hours', render: (s) => s.hoursInvested },
    { header: 'Annual Uplift', render: (s) => formatINR(s.expectedAnnualUplift) },
    {
      header: 'ROI %',
      render: (s) => {
        const roi = skillRoiPercent(s);
        return <span className={roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatPercent(roi)}</span>;
      },
    },
    {
      header: 'Payback',
      render: (s) => {
        const months = skillPaybackMonths(s);
        return months === null ? '—' : `${months.toFixed(1)} mo`;
      },
    },
    { header: 'Status', render: (s) => s.status },
    {
      header: '',
      render: (s) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(s)} className="p-1.5 rounded-md hover:bg-navy-700 text-slate-400 hover:text-white">
            <Pencil size={15} />
          </button>
          <button onClick={() => deleteSkill(s.id)} className="p-1.5 rounded-md hover:bg-rose-500/15 text-slate-400 hover:text-rose-400">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-white font-medium mb-1">Skill Investment ROI</h3>
          <p className="text-xs text-slate-500">How much you spend upskilling, and what it's paid back.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-cyan-accent text-navy-950 font-medium rounded-lg px-4 py-2 text-sm hover:bg-cyan-300 transition-colors">
          <Plus size={16} /> Add Skill
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <KpiCard label="Skill Investment This Year" value={formatINR(totalThisYear)} />
        <KpiCard label="Realized Salary Impact" value={formatINR(realizedImpact)} accent="positive" />
      </div>
      {skills.length > 0 && (
        <p className="text-sm text-cyan-accent font-medium mb-4">Your upskilling portfolio has generated {formatINRCompact(realizedImpact)} in salary impact.</p>
      )}

      {skills.length === 0 ? (
        <EmptyState icon={Briefcase} title="No skills tracked yet" description="Log courses and certifications to see their ROI on your salary." actionLabel="Add your first skill" onAction={openAdd} />
      ) : (
        <DataTable rows={skills} columns={columns} keyFor={(s) => s.id} />
      )}

      <Drawer open={drawerOpen} title={editing ? 'Edit Skill' : 'Add Skill'} onClose={() => setDrawerOpen(false)}>
        <AddSkillForm initial={editing || undefined} onSubmit={handleSubmit} onCancel={() => setDrawerOpen(false)} />
      </Drawer>
    </Card>
  );
}

export default function Career() {
  return (
    <div>
      <Header title="Career Capital" subtitle="Your career, valued in rupees" />
      <div className="px-8 py-6 space-y-6">
        <HumanCapitalSection />
        <JobSwitchSection />
        <IncomeStreamsSection />
        <SkillsSection />
      </div>
    </div>
  );
}
