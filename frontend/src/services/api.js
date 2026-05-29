import axios from 'axios';
import { MOCK_PROPERTIES } from '../data/mockProperties';

/** @type {{ apiBaseUrl: string, useMock: boolean } | null} */
let apiConfig = null;

function normalizeBaseUrl(url) {
  return (url || '').trim().replace(/\/$/, '');
}

function isPlaceholderUrl(url) {
  return !url || /REPLACE/i.test(url);
}

function isLocalhostUrl(url) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

function isPublicDeployedSite() {
  if (typeof window === 'undefined') {
    return import.meta.env.PROD;
  }
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1';
}

function defaultApiBaseUrl() {
  if (import.meta.env.DEV) {
    return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) || 'http://localhost:8000';
  }
  return normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
}

function resolveApiBaseUrl(fromFile, envBase) {
  if (!isPlaceholderUrl(fromFile)) {
    return fromFile;
  }
  const envOk =
    !isPlaceholderUrl(envBase) &&
    !(isPublicDeployedSite() && isLocalhostUrl(envBase));
  if (envOk) {
    return envBase;
  }
  return defaultApiBaseUrl();
}

/**
 * Load API settings from /config.json (editable after deploy) with Vite env fallbacks.
 */
export async function loadApiConfig() {
  if (apiConfig) {
    return apiConfig;
  }

  const envBase = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  const envMock = import.meta.env.VITE_USE_MOCK !== 'false';

  try {
    const response = await fetch('/config.json', { cache: 'no-store' });
    if (response.ok) {
      const json = await response.json();
      const fromFile = normalizeBaseUrl(json.apiBaseUrl);
      apiConfig = {
        apiBaseUrl: resolveApiBaseUrl(fromFile, envBase),
        useMock: json.useMock ?? envMock,
      };
    }
  } catch {
    // config.json missing
  }

  if (!apiConfig) {
    apiConfig = {
      apiBaseUrl: resolveApiBaseUrl('', envBase),
      useMock: envMock,
    };
  }

  return apiConfig;
}

function createClient(baseURL) {
  return axios.create({
    baseURL,
    timeout: 30000,
  });
}

export function formatApiError(err, apiBaseUrl) {
  if (apiConfig?.useMock) {
    return err?.message ?? 'Failed to load properties';
  }

  if (!apiBaseUrl || isPlaceholderUrl(apiBaseUrl)) {
    return (
      'API URL not set. From the project root run: .\\scripts\\connect-production.ps1 ' +
      '-HostingUrl "https://cherrycolacool.web.app"'
    );
  }

  if (isPublicDeployedSite() && isLocalhostUrl(apiBaseUrl)) {
    return (
      'Production site cannot use localhost. Run .\\scripts\\connect-production.ps1 ' +
      'to set your Cloud Run URL in config.json and redeploy.'
    );
  }

  if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
    return (
      `Cannot reach API at ${apiBaseUrl}. ` +
      'Confirm Cloud Run service "cherrycolacool-api" is up, then run: .\\scripts\\set-cors.ps1 -HostingUrl "https://cherrycolacool.web.app"'
    );
  }

  if (err?.response?.status) {
    return `API error ${err.response.status}: ${err.response.data?.error ?? err.message}`;
  }

  return err?.message ?? 'Failed to load properties';
}

/**
 * @param {import('../hooks/usePropertyFilters').FilterState} [filters]
 */
export async function fetchProperties(filters) {
  const { apiBaseUrl, useMock } = await loadApiConfig();

  if (useMock) {
    return filterMockProperties(MOCK_PROPERTIES, filters);
  }

  if (!apiBaseUrl || isPlaceholderUrl(apiBaseUrl)) {
    throw new Error(formatApiError({ code: 'ERR_CONFIG' }, apiBaseUrl));
  }

  if (isPublicDeployedSite() && isLocalhostUrl(apiBaseUrl)) {
    throw new Error(formatApiError({ code: 'ERR_CONFIG' }, apiBaseUrl));
  }

  const client = createClient(apiBaseUrl);
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
  const { apiBaseUrl, useMock } = await loadApiConfig();
  if (useMock || !apiBaseUrl || isPlaceholderUrl(apiBaseUrl)) {
    return {
      explanation: 'AI briefs require a live backend and Gemini API key.',
      ai: false,
    };
  }

  const client = createClient(apiBaseUrl);
  const { data } = await client.post('/api/ai/explain', { property });
  return data;
}
