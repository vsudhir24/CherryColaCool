/** @typedef {'critical' | 'high' | 'medium' | 'low'} RiskTier */

/** @typedef {'inspect' | 'fine' | 'demolish' | 'rehab' | 'monitor'} SuggestedAction */

/**
 * @param {number} score
 * @returns {RiskTier}
 */
export function getRiskTier(score) {
  if (score >= 90) return 'critical';
  if (score >= 75) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

/**
 * @param {RiskTier} tier
 */
export function getTierColor(tier) {
  const colors = {
    critical: '#f85149',
    high: '#e85d04',
    medium: '#d29922',
    low: '#3fb950',
  };
  return colors[tier] ?? colors.low;
}

/**
 * @param {RiskTier} tier
 */
export function getTierLabel(tier) {
  const labels = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Lower',
  };
  return labels[tier] ?? 'Unknown';
}

/**
 * @param {SuggestedAction} action
 */
export function getActionLabel(action) {
  const labels = {
    inspect: 'Inspect',
    fine: 'Issue fine',
    demolish: 'Demolish',
    rehab: 'Rehabilitate',
    monitor: 'Monitor',
  };
  return labels[action] ?? action;
}

/**
 * @param {SuggestedAction} action
 */
export function getActionDescription(action) {
  const descriptions = {
    inspect: 'Send field team for structural & safety assessment',
    fine: 'Enforce blight ordinance with citation pathway',
    demolish: 'Prioritize demolition — severe hazard or abandonment',
    rehab: 'Candidate for stabilization or neighborhood rehab program',
    monitor: 'Track complaints; intervene if conditions worsen',
  };
  return descriptions[action] ?? '';
}

export const DETROIT_CENTER = { lat: 42.3314, lng: -83.0458 };
export const DETROIT_ZOOM = 12;
