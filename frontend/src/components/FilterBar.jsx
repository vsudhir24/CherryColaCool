import { DETROIT_ZIPS } from '../data/mockProperties';

export default function FilterBar({
  filters,
  updateFilter,
  resetFilters,
  activeFilterCount,
  resultCount,
}) {
  return (
    <section className="shrink-0 border-b border-detroit-border bg-detroit-panel/70 px-4 py-3 backdrop-blur-sm">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Address" className="min-w-[180px] flex-1">
          <input
            type="search"
            className="input-field"
            placeholder="Search by street…"
            value={filters.address}
            onChange={(e) => updateFilter('address', e.target.value)}
          />
        </Field>

        <Field label="ZIP" className="w-28">
          <select
            className="input-field"
            value={filters.zip}
            onChange={(e) => updateFilter('zip', e.target.value)}
          >
            <option value="">All</option>
            {DETROIT_ZIPS.map((zip) => (
              <option key={zip} value={zip}>
                {zip}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Min score" className="w-24">
          <input
            type="number"
            min={0}
            max={100}
            className="input-field"
            placeholder="0"
            value={filters.scoreMin ?? ''}
            onChange={(e) =>
              updateFilter('scoreMin', e.target.value === '' ? null : Number(e.target.value))
            }
          />
        </Field>

        <Field label="Max score" className="w-24">
          <input
            type="number"
            min={0}
            max={100}
            className="input-field"
            placeholder="100"
            value={filters.scoreMax ?? ''}
            onChange={(e) =>
              updateFilter('scoreMax', e.target.value === '' ? null : Number(e.target.value))
            }
          />
        </Field>

        <Toggle
          label="Tax delinquent"
          checked={filters.taxDelinquentOnly}
          onChange={(v) => updateFilter('taxDelinquentOnly', v)}
        />

        <Toggle
          label="Vacant + blight"
          checked={filters.vacantBlightOnly}
          onChange={(v) => updateFilter('vacantBlightOnly', v)}
        />

        <div className="flex items-center gap-2 pb-0.5">
          {activeFilterCount > 0 && (
            <button type="button" className="btn-ghost text-xs" onClick={resetFilters}>
              Clear ({activeFilterCount})
            </button>
          )}
          <span className="rounded-full bg-detroit-accent/20 px-2.5 py-1 text-xs font-medium text-blue-300">
            {resultCount} properties · highest priority first
          </span>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-detroit-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-detroit-border bg-detroit-slate/60 px-3 py-2 transition hover:border-detroit-muted">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-detroit-border bg-detroit-slate accent-detroit-accent"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="whitespace-nowrap text-xs font-medium text-detroit-muted">{label}</span>
    </label>
  );
}
