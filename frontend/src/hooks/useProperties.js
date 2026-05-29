import { useCallback, useEffect, useState } from 'react';
import { fetchProperties, formatApiError, loadApiConfig } from '../services/api';
import { DEFAULT_FILTERS } from './usePropertyFilters';

export function useProperties(filters) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProperties(filters);
      setProperties(data);
    } catch (err) {
      const { apiBaseUrl } = await loadApiConfig().catch(() => ({ apiBaseUrl: '' }));
      setError(formatApiError(err, apiBaseUrl));
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  return { properties, loading, error, reload: load };
}

export { DEFAULT_FILTERS };
