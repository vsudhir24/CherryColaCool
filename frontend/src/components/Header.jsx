export default function Header({ stats }) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-detroit-border bg-detroit-panel/90 px-5 py-3 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-michigan-blue shadow-glow ring-1 ring-michigan-maize/30">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-michigan-maize" fill="currentColor">
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.2l7.5 3.75L12 11.7 4.5 7.95 12 4.2zM4 8.9l7 3.5v7.35l-7-3.5V8.9zm9 10.85v-7.35l7-3.5v3.85l-7 3.5z" />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-lg font-bold tracking-tight text-white">
            Detroit Blight Prioritizer
          </h1>
          <p className="text-xs text-detroit-muted">
            Michigan · Where to intervene first with limited budget
          </p>
        </div>
      </div>

      <div className="hidden items-center gap-6 sm:flex">
        <Stat label="Prioritized" value={stats.total} />
        <Stat label="Critical (90+)" value={stats.critical} accent="text-detroit-danger" />
        <Stat label="Vacant" value={stats.vacant} />
        <Stat label="Tax delinquent" value={stats.taxDelinquent} />
      </div>

    </header>
  );
}

function Stat({ label, value, accent = 'text-white' }) {
  return (
    <div className="text-right">
      <p className={`font-display text-xl font-bold tabular-nums ${accent}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-detroit-muted">{label}</p>
    </div>
  );
}
