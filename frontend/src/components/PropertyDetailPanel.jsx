import clsx from 'clsx';
import ScoreBadge from './ScoreBadge';
import {
  getActionDescription,
  getActionLabel,
  getRiskTier,
  getTierColor,
  getTierLabel,
} from '../utils/scoring';

export default function PropertyDetailPanel({ property, onClose }) {
  if (!property) return null;

  const tier = getRiskTier(property.priorityScore);
  const tierColor = getTierColor(tier);

  return (
    <>
      <button
        type="button"
        className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] lg:hidden"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside
        className={clsx(
          'absolute right-0 top-0 z-30 flex h-full w-full max-w-md flex-col',
          'border-l border-detroit-border glass-panel shadow-panel',
          'transition-transform duration-200 ease-out',
        )}
      >
        <div className="flex items-start justify-between border-b border-detroit-border p-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-detroit-muted">
              Property detail
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-white">{property.address}</h2>
            <p className="text-sm text-detroit-muted">Detroit, MI {property.zip}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-detroit-muted transition hover:bg-detroit-border hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-detroit-muted">Priority score</p>
              <div className="mt-1 flex items-center gap-2">
                <ScoreBadge score={property.priorityScore} size="lg" showTier={false} />
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-semibold uppercase"
                  style={{ color: tierColor, backgroundColor: `${tierColor}22` }}
                >
                  {getTierLabel(tier)} risk
                </span>
              </div>
            </div>
          </div>

          <MetricGrid property={property} />

          <section className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-detroit-muted">
              Why ranked high
            </h3>
            <ul className="space-y-2">
              {property.rankReasons.map((reason) => (
                <li
                  key={reason}
                  className="flex gap-2 rounded-lg border border-detroit-border/60 bg-detroit-slate/50 px-3 py-2 text-sm text-gray-200"
                >
                  <span className="text-detroit-accent">→</span>
                  {reason}
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-detroit-muted">
              Suggested action
            </h3>
            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: `${tierColor}44`,
                background: `linear-gradient(135deg, ${tierColor}15, transparent)`,
              }}
            >
              <p className="font-display text-lg font-bold capitalize text-white">
                {getActionLabel(property.suggestedAction)}
              </p>
              <p className="mt-1 text-sm text-detroit-muted">
                {getActionDescription(property.suggestedAction)}
              </p>
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}

function MetricGrid({ property }) {
  const items = [
    { label: 'Vacancy', value: capitalize(property.vacancyStatus) },
    { label: 'Blight violations', value: property.blightViolations },
    {
      label: 'Tax delinquency',
      value:
        property.taxDelinquentYears > 0
          ? `${property.taxDelinquentYears} yr · $${property.taxDelinquentAmount.toLocaleString()}`
          : 'Current',
    },
    { label: '311 complaints', value: property.complaints311 },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-lg border border-detroit-border bg-detroit-slate/50 p-3"
        >
          <p className="text-[10px] uppercase tracking-wider text-detroit-muted">{label}</p>
          <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
        </div>
      ))}
    </div>
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
