import axios from 'axios';
import { MOCK_PROPERTIES } from '../data/mockProperties';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

/**
 * Fetch prioritized properties from backend or mock.
 * Backend contract (for your teammate): GET /api/properties
 * Expected shape: array of property objects matching mock schema.
 *
 * @param {import('../hooks/usePropertyFilters').FilterState} [filters]
 */
export async function fetchProperties(filters) {
  if (USE_MOCK) {
    return filterMockProperties(MOCK_PROPERTIES, filters);
  }

  const { data } = await client.get('/api/properties', {
    params: mapFiltersToParams(filters),
  });
  return Array.isArray(data) ? data : data.properties ?? [];
}

function mapFiltersToParams(filters) {
  if (!filters) return {};
  return {
    address: filters.address || undefined,
    zip: filters.zip || undefined,
    score_min: filters.scoreMin ?? undefined,
    score_max: filters.scoreMax ?? undefined,
    tax_delinquent: filters.taxDelinquentOnly || undefined,
    vacant_blight: filters.vacantBlightOnly || undefined,
    sort: 'priority_desc',
  };
}

function filterMockProperties(properties, filters) {
  if (!filters) {
    return sortByPriority(properties);
  }

  let result = [...properties];

  if (filters.address?.trim()) {
    const q = filters.address.trim().toLowerCase();
    result = result.filter((p) => p.address.toLowerCase().includes(q));
  }

  if (filters.zip) {
    result = result.filter((p) => p.zip === filters.zip);
  }

  if (filters.scoreMin != null) {
    result = result.filter((p) => p.priorityScore >= filters.scoreMin);
  }

  if (filters.scoreMax != null) {
    result = result.filter((p) => p.priorityScore <= filters.scoreMax);
  }

  if (filters.taxDelinquentOnly) {
    result = result.filter((p) => p.taxDelinquentYears > 0);
  }

  if (filters.vacantBlightOnly) {
    result = result.filter(
      (p) => p.vacancyStatus === 'vacant' && p.blightViolations > 0,
    );
  }

  return sortByPriority(result);
}

function sortByPriority(properties) {
  return [...properties].sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * AI-generated intervention brief (Gemini via backend).
 * @param {object} property
 */
export async function fetchAiExplanation(property) {
  const { data } = await client.post('/api/ai/explain', { property });
  return data;
}
