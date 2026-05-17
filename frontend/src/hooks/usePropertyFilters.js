import { useMemo, useState } from 'react';

export const DEFAULT_FILTERS = {
  address: '',
  zip: '',
  scoreMin: null,
  scoreMax: null,
  taxDelinquentOnly: false,
  vacantBlightOnly: false,
};

export function usePropertyFilters() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.address?.trim()) count += 1;
    if (filters.zip) count += 1;
    if (filters.scoreMin != null) count += 1;
    if (filters.scoreMax != null) count += 1;
    if (filters.taxDelinquentOnly) count += 1;
    if (filters.vacantBlightOnly) count += 1;
    return count;
  }, [filters]);

  return { filters, updateFilter, resetFilters, activeFilterCount };
}
