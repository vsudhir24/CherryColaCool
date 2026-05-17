import clsx from 'clsx';
import { getRiskTier, getTierColor, getTierLabel } from '../utils/scoring';

export default function ScoreBadge({ score, size = 'md', showTier = true }) {
  const tier = getRiskTier(score);
  const color = getTierColor(tier);

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-lg px-3 py-1.5 font-bold',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-md font-semibold tabular-nums',
        sizes[size],
      )}
      style={{
        backgroundColor: `${color}22`,
        color,
        border: `1px solid ${color}55`,
      }}
    >
      <span>{score}</span>
      {showTier && size !== 'sm' && (
        <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">
          {getTierLabel(tier)}
        </span>
      )}
    </span>
  );
}
