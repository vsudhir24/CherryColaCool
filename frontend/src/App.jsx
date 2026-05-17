import { useMemo, useState } from 'react';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import PropertyList from './components/PropertyList';
import PropertyMap from './components/PropertyMap';
import PropertyDetailPanel from './components/PropertyDetailPanel';
import { usePropertyFilters } from './hooks/usePropertyFilters';
import { useProperties } from './hooks/useProperties';

export default function App() {
  const { filters, updateFilter, resetFilters, activeFilterCount } = usePropertyFilters();
  const { properties, loading, error } = useProperties(filters);
  const [selectedProperty, setSelectedProperty] = useState(null);

  const stats = useMemo(() => {
    const critical = properties.filter((p) => p.priorityScore >= 90).length;
    const vacant = properties.filter((p) => p.vacancyStatus === 'vacant').length;
    const taxDelinquent = properties.filter((p) => p.taxDelinquentYears > 0).length;
    return {
      total: properties.length,
      critical,
      vacant,
      taxDelinquent,
    };
  }, [properties]);

  const handleSelect = (property) => {
    setSelectedProperty(property);
  };

  const handleClosePanel = () => {
    setSelectedProperty(null);
  };

  return (
    <div className="flex h-full flex-col">
      <Header stats={stats} />

      <FilterBar
        filters={filters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
        activeFilterCount={activeFilterCount}
        resultCount={properties.length}
      />

      {error && (
        <div className="shrink-0 border-b border-detroit-danger/50 bg-detroit-danger/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <main className="flex min-h-0 flex-1">
        <section className="flex w-full max-w-[400px] shrink-0 flex-col border-r border-detroit-border bg-detroit-panel/50">
          <div className="flex items-center justify-between border-b border-detroit-border px-4 py-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-detroit-muted">
              Ranked intervention list
            </h2>
            <span className="text-[10px] text-detroit-muted">Highest priority first</span>
          </div>
          <PropertyList
            properties={properties}
            selectedId={selectedProperty?.id}
            onSelect={handleSelect}
            loading={loading}
          />
        </section>

        <section className="relative min-w-0 flex-1">
          <PropertyMap
            properties={properties}
            selectedId={selectedProperty?.id}
            onSelect={handleSelect}
          />
          {selectedProperty && (
            <PropertyDetailPanel property={selectedProperty} onClose={handleClosePanel} />
          )}
        </section>
      </main>
    </div>
  );
}
