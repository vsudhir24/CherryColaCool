import clsx from 'clsx';
import ScoreBadge from './ScoreBadge';
import { getRiskTier, getTierColor } from '../utils/scoring';

export default function PropertyList({
  properties,
  selectedId,
  onSelect,
  loading,
}) {
  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-2 p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-detroit-border/40" />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <p className="text-sm font-medium text-white">No properties match filters</p>
        <p className="mt-1 text-xs text-detroit-muted">Try widening score range or clearing filters</p>
      </div>
    );
  }

  return (
    <ul className="flex-1 overflow-y-auto p-2">
      {properties.map((property, index) => {
        const tier = getRiskTier(property.priorityScore);
        const isSelected = property.id === selectedId;

        return (
          <li key={property.id}>
            <button
              type="button"
              onClick={() => onSelect(property)}
              className={clsx(
                'mb-1.5 flex w-full items-start gap-3 rounded-xl border p-3 text-left transition',
                isSelected
                  ? 'border-detroit-accent bg-detroit-accent/10 shadow-glow'
                  : 'border-transparent bg-detroit-slate/40 hover:border-detroit-border hover:bg-detroit-panel',
              )}
            >
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold text-white"
                style={{ backgroundColor: getTierColor(tier) }}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-sm text-white">{property.address}</p>
                <p className="text-xs text-detroit-muted">
                  {property.zip} · {property.vacancyStatus}
                  {property.blightViolations > 0 && ` · ${property.blightViolations} violations`}
                </p>
              </div>
              <ScoreBadge score={property.priorityScore} size="sm" showTier={false} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
