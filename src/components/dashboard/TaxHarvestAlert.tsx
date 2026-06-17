import { useFinancialDataContext } from '../../context/FinancialDataContext';
import { useNetWorth } from '../../hooks/useNetWorth';
import { useTaxHarvest } from '../../hooks/useTaxHarvest';
import { findLossPositions, isWithinHarvestWindow, daysUntilWindowOpens, computeHarvestOpportunity } from '../../utils/taxHarvest';
import { Card } from '../ui/Card';
import { Field, Input } from '../ui/FormField';
import { formatINR } from '../../utils/formatters';

export function TaxHarvestAlert() {
  const { data } = useFinancialDataContext();
  const netWorth = useNetWorth(data);
  const { data: harvestData, setRealisedGains } = useTaxHarvest();

  const positions = findLossPositions(netWorth.summaries);
  const withinWindow = isWithinHarvestWindow();

  return (
    <Card>
      <h3 className="text-white font-medium mb-3">Tax Loss Harvesting</h3>
      {!withinWindow ? (
        <p className="text-sm text-slate-400">Tax harvesting window opens January 1. {daysUntilWindowOpens()} day(s) to go.</p>
      ) : positions.length === 0 ? (
        <p className="text-sm text-slate-400">No unrealised losses found in your mutual funds or stocks right now.</p>
      ) : (
        <div className="space-y-3">
          <Field label="Realised gains this FY (₹)">
            <Input
              type="number"
              value={harvestData.realisedGainsThisFY || ''}
              onChange={(e) => setRealisedGains(parseFloat(e.target.value) || 0)}
              className="max-w-xs"
            />
          </Field>
          {(() => {
            const opp = computeHarvestOpportunity(positions, harvestData.realisedGainsThisFY);
            return opp.offsetAmount > 0 ? (
              <p className="text-sm text-amber-300">
                Tax harvesting opportunity: You have {formatINR(opp.totalUnrealisedLoss)} in unrealised losses in {positions.map((p) => p.name).join(', ')}.
                Booking these losses now can save you {formatINR(opp.estimatedTaxSaved)} in tax this FY. (You can re-buy after 1 day to maintain exposure if
                desired.)
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                You have {formatINR(opp.totalUnrealisedLoss)} in unrealised losses, but no realised gains entered yet to offset against this FY.
              </p>
            );
          })()}
          <p className="text-xs text-slate-500">Verify with your CA before acting on this.</p>
        </div>
      )}
    </Card>
  );
}
