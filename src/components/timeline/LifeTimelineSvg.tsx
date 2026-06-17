import { useState } from 'react';
import type { LifeEvent, LifeEventCategory } from '../../types/lifeTimeline';
import type { FinancialEvent } from '../../utils/lifeTimelineCalculations';
import { dateToYearFraction } from '../../utils/lifeTimelineCalculations';
import type { NetWorthYearPoint } from '../../utils/lifeTimelineCalculations';
import { formatINR, formatINRCompact, formatDate } from '../../utils/formatters';

const CATEGORY_COLORS: Record<LifeEventCategory, string> = {
  Career: '#22d3ee',
  Personal: '#a78bfa',
  Travel: '#34d399',
  Education: '#fb923c',
  Family: '#f472b6',
};

const FINANCIAL_COLOR = '#94a3b8';
const FI_COLOR = '#fbbf24';

const PADDING_X = 50;
const HEIGHT = 380;
const Y_LIFE_TRACK = 70;
const Y_NETWORTH_TOP = 120;
const Y_NETWORTH_BOTTOM = 260;
const Y_AXIS = 290;
const Y_FINANCIAL_TRACK = 340;

type Selection = { kind: 'life'; event: LifeEvent } | { kind: 'financial'; event: FinancialEvent } | null;

interface LifeTimelineSvgProps {
  startYear: number;
  endYear: number;
  pxPerYear: number;
  todayYearFraction: number;
  lifeEvents: LifeEvent[];
  financialEvents: FinancialEvent[];
  netWorthArc: NetWorthYearPoint[];
}

export function LifeTimelineSvg({ startYear, endYear, pxPerYear, todayYearFraction, lifeEvents, financialEvents, netWorthArc }: LifeTimelineSvgProps) {
  const [selected, setSelected] = useState<Selection>(null);

  const width = PADDING_X * 2 + (endYear - startYear) * pxPerYear;
  const x = (year: number) => PADDING_X + (year - startYear) * pxPerYear;

  const yearStep = pxPerYear >= 40 ? 1 : pxPerYear >= 18 ? 2 : 5;
  const yearTicks: number[] = [];
  for (let y = startYear; y <= endYear; y += yearStep) yearTicks.push(y);

  const values = netWorthArc.map((p) => p.netWorth);
  const minValue = Math.min(0, ...values);
  const maxValue = Math.max(1, ...values);
  const scaleY = (value: number) => {
    if (maxValue === minValue) return Y_NETWORTH_BOTTOM;
    const ratio = (value - minValue) / (maxValue - minValue);
    return Y_NETWORTH_BOTTOM - ratio * (Y_NETWORTH_BOTTOM - Y_NETWORTH_TOP);
  };
  const arcPoints = netWorthArc.map((p) => `${x(p.year)},${scaleY(p.netWorth)}`).join(' ');

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-navy-700 bg-navy-900/40">
        <svg width={width} height={HEIGHT} className="block">
          {/* Net worth arc */}
          {netWorthArc.length > 1 && <polyline points={arcPoints} fill="none" stroke="#22d3ee" strokeWidth={2} strokeOpacity={0.6} />}

          {/* Year axis */}
          <line x1={PADDING_X} y1={Y_AXIS} x2={width - PADDING_X / 2} y2={Y_AXIS} stroke="#2e3950" strokeWidth={1} />
          {yearTicks.map((y) => (
            <g key={y}>
              <line x1={x(y)} y1={Y_AXIS - 4} x2={x(y)} y2={Y_AXIS + 4} stroke="#475569" />
              <text x={x(y)} y={Y_AXIS + 18} fontSize={11} fill="#64748b" textAnchor="middle">
                {y}
              </text>
            </g>
          ))}

          {/* Today line */}
          {todayYearFraction >= startYear && todayYearFraction <= endYear && (
            <g>
              <line x1={x(todayYearFraction)} y1={20} x2={x(todayYearFraction)} y2={HEIGHT - 10} stroke="#22d3ee" strokeWidth={1.5} strokeDasharray="4 3" />
              <text x={x(todayYearFraction)} y={14} fontSize={11} fill="#22d3ee" textAnchor="middle" fontWeight={600}>
                TODAY
              </text>
            </g>
          )}

          {/* Life events track */}
          {lifeEvents.map((e) => (
            <g key={e.id} className="cursor-pointer" onClick={() => setSelected({ kind: 'life', event: e })}>
              <title>{e.name}</title>
              <circle cx={x(e.year)} cy={Y_LIFE_TRACK} r={7} fill={CATEGORY_COLORS[e.category]} stroke="#0f172a" strokeWidth={2} />
            </g>
          ))}

          {/* Financial events track */}
          {financialEvents.map((e) => {
            const yearFraction = dateToYearFraction(e.date);
            if (yearFraction < startYear || yearFraction > endYear) return null;
            return (
              <g key={e.id} className="cursor-pointer" onClick={() => setSelected({ kind: 'financial', event: e })}>
                <title>{e.title}</title>
                {e.isSpecial ? (
                  <text x={x(yearFraction)} y={Y_FINANCIAL_TRACK + 6} fontSize={20} textAnchor="middle" fill={FI_COLOR}>
                    ★
                  </text>
                ) : (
                  <circle cx={x(yearFraction)} cy={Y_FINANCIAL_TRACK} r={6} fill={FINANCIAL_COLOR} stroke="#0f172a" strokeWidth={2} />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {selected && (
        <div className="mt-4 bg-navy-700/50 rounded-lg p-4 flex items-start justify-between">
          {selected.kind === 'life' ? (
            <div>
              <p className="text-white font-medium">{selected.event.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {selected.event.category} · {selected.event.year}
                {selected.event.estimatedCost ? ` · ${formatINR(selected.event.estimatedCost)}` : ''}
              </p>
              {selected.event.notes && <p className="text-sm text-slate-300 mt-2">{selected.event.notes}</p>}
            </div>
          ) : (
            <div>
              <p className="text-white font-medium">{selected.event.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatDate(selected.event.date, 'MMM yyyy')}
                {selected.event.amount ? ` · ${formatINRCompact(selected.event.amount)}` : ''}
              </p>
            </div>
          )}
          <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-sm">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
