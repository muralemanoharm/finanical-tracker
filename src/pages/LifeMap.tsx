import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Map as MapIcon } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Card } from '../components/ui/Card';
import { Drawer } from '../components/ui/Drawer';
import { EmptyState } from '../components/ui/EmptyState';
import { DataTable, type Column } from '../components/ui/DataTable';
import { AddLifeEventForm } from '../components/forms/AddLifeEventForm';
import { LifeTimelineSvg } from '../components/timeline/LifeTimelineSvg';
import { CostBurdenChart } from '../components/charts/CostBurdenChart';
import { useFinancialDataContext } from '../context/FinancialDataContext';
import { useLifeTimeline } from '../hooks/useLifeTimeline';
import { useProjections, projectNetWorth } from '../hooks/useProjections';
import { useFI } from '../hooks/useFI';
import { deriveFinancialEvents, dateToYearFraction, buildNetWorthArc, cumulativeCostByYear } from '../utils/lifeTimelineCalculations';
import { todayISO } from '../utils/calculations';
import { formatINR, formatDate } from '../utils/formatters';
import type { LifeEvent, LifeEventCategory } from '../types/lifeTimeline';

const CATEGORY_COLORS: Record<LifeEventCategory, string> = {
  Career: '#22d3ee',
  Personal: '#a78bfa',
  Travel: '#34d399',
  Education: '#fb923c',
  Family: '#f472b6',
};

const QUICK_ADD_EVENTS: { name: string; category: LifeEventCategory }[] = [
  { name: 'Move Abroad', category: 'Career' },
  { name: 'Marriage', category: 'Family' },
  { name: 'Buy House', category: 'Personal' },
  { name: 'Start Business', category: 'Career' },
  { name: 'Child', category: 'Family' },
  { name: 'Parent Care Fund', category: 'Family' },
  { name: 'Sabbatical / Career Break', category: 'Career' },
  { name: 'Higher Education', category: 'Education' },
];

const ZOOM_LEVELS = [
  { label: '5 Year View', pxPerYear: 140 },
  { label: '10 Year View', pxPerYear: 70 },
  { label: 'Full Life View', pxPerYear: 30 },
] as const;

export default function LifeMap() {
  const { data } = useFinancialDataContext();
  const { data: timelineData, addEvent, updateEvent, deleteEvent } = useLifeTimeline();
  const { maturityProjections } = useProjections(data);
  const fi = useFI(data);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<LifeEvent | null>(null);
  const [quickAddSeed, setQuickAddSeed] = useState<{ name: string; category: LifeEventCategory } | null>(null);
  const [zoomIndex, setZoomIndex] = useState(1);

  const lifeEvents = timelineData.events;
  const financialEvents = useMemo(() => deriveFinancialEvents(data, maturityProjections, fi), [data, maturityProjections, fi]);

  const currentYear = new Date().getFullYear();
  const profileEndYear = currentYear + Math.max(0, data.profile.retirementAge - data.profile.age);
  const maxLifeEventYear = lifeEvents.length > 0 ? Math.max(...lifeEvents.map((e) => e.year)) : currentYear;
  const maxFinancialEventYear = financialEvents.length > 0 ? Math.max(...financialEvents.map((e) => Math.ceil(dateToYearFraction(e.date)))) : currentYear;
  const startYear = currentYear;
  const endYear = Math.max(profileEndYear, maxLifeEventYear, maxFinancialEventYear) + 1;

  const netWorthArc = useMemo(
    () => buildNetWorthArc(startYear, endYear, currentYear, (years) => projectNetWorth(data, years), lifeEvents),
    [startYear, endYear, currentYear, data, lifeEvents],
  );
  const costBurdenRows = useMemo(() => cumulativeCostByYear(lifeEvents), [lifeEvents]);
  const todayYearFraction = dateToYearFraction(todayISO());

  const openAdd = () => {
    setEditing(null);
    setQuickAddSeed(null);
    setDrawerOpen(true);
  };
  const openEdit = (e: LifeEvent) => {
    setEditing(e);
    setQuickAddSeed(null);
    setDrawerOpen(true);
  };
  const openQuickAdd = (seed: { name: string; category: LifeEventCategory }) => {
    setEditing(null);
    setQuickAddSeed(seed);
    setDrawerOpen(true);
  };
  const handleSubmit = (values: Omit<LifeEvent, 'id'>) => {
    if (editing) updateEvent(editing.id, values);
    else addEvent(values);
    setDrawerOpen(false);
  };

  const columns: Column<LifeEvent>[] = [
    {
      header: 'Event',
      render: (e) => (
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[e.category] }} />
          <span className="font-medium text-white">{e.name}</span>
        </span>
      ),
    },
    { header: 'Category', render: (e) => e.category },
    { header: 'Year', render: (e) => e.year },
    { header: 'Estimated Cost', render: (e) => (e.estimatedCost ? formatINR(e.estimatedCost) : '—') },
    {
      header: '',
      render: (e) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(e)} className="p-1.5 rounded-md hover:bg-navy-700 text-slate-400 hover:text-white">
            <Pencil size={15} />
          </button>
          <button onClick={() => deleteEvent(e.id)} className="p-1.5 rounded-md hover:bg-rose-500/15 text-slate-400 hover:text-rose-400">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Header title="Life Map" subtitle="Your life events, financial milestones, and net worth — on one timeline" />
      <div className="px-8 py-6 space-y-6">
        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-accent" /> Life Events
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Financial Events
              </span>
              <span className="flex items-center gap-1.5">★ Financial Independence</span>
            </div>
            <div className="flex gap-2">
              {ZOOM_LEVELS.map((z, i) => (
                <button
                  key={z.label}
                  onClick={() => setZoomIndex(i)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    zoomIndex === i ? 'bg-cyan-accent text-navy-950' : 'bg-navy-700 text-slate-300 hover:bg-navy-600'
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>
          <LifeTimelineSvg
            startYear={startYear}
            endYear={endYear}
            pxPerYear={ZOOM_LEVELS[zoomIndex].pxPerYear}
            todayYearFraction={todayYearFraction}
            lifeEvents={lifeEvents}
            financialEvents={financialEvents}
            netWorthArc={netWorthArc}
          />
        </Card>

        <Card>
          <h3 className="text-white font-medium mb-3">Cumulative Cost Burden</h3>
          <CostBurdenChart rows={costBurdenRows} />
        </Card>

        <Card>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-white font-medium mb-1">Life Events</h3>
              <p className="text-xs text-slate-500">Add the moments that will shape your finances.</p>
            </div>
            <button onClick={openAdd} className="flex items-center gap-2 bg-cyan-accent text-navy-950 font-medium rounded-lg px-4 py-2 text-sm hover:bg-cyan-300 transition-colors">
              <Plus size={16} /> Add Event
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {QUICK_ADD_EVENTS.map((q) => (
              <button
                key={q.name}
                onClick={() => openQuickAdd(q)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-navy-700 text-slate-300 hover:bg-navy-600 transition-colors"
              >
                + {q.name}
              </button>
            ))}
          </div>

          {lifeEvents.length === 0 ? (
            <EmptyState icon={MapIcon} title="No life events yet" description="Use a quick-add button above or add a custom event to start mapping your life." actionLabel="Add your first event" onAction={openAdd} />
          ) : (
            <DataTable rows={[...lifeEvents].sort((a, b) => a.year - b.year)} columns={columns} keyFor={(e) => e.id} />
          )}
        </Card>

        {financialEvents.length > 0 && (
          <Card>
            <h3 className="text-white font-medium mb-3">Upcoming Financial Milestones</h3>
            <div className="divide-y divide-navy-700">
              {[...financialEvents]
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-slate-200">{e.title}</span>
                    <span className="text-slate-400">{formatDate(e.date, 'MMM yyyy')}</span>
                    <span className="text-slate-200 font-medium">{e.amount ? formatINR(e.amount) : ''}</span>
                  </div>
                ))}
            </div>
          </Card>
        )}

        <Drawer open={drawerOpen} title={editing ? 'Edit Life Event' : 'Add Life Event'} onClose={() => setDrawerOpen(false)}>
          <AddLifeEventForm
            initial={editing || (quickAddSeed ? { name: quickAddSeed.name, year: currentYear, category: quickAddSeed.category, estimatedCost: undefined, notes: '' } : undefined)}
            onSubmit={handleSubmit}
            onCancel={() => setDrawerOpen(false)}
          />
        </Drawer>
      </div>
    </div>
  );
}
