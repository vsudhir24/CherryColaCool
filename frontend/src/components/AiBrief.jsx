import { useEffect, useState } from 'react';
import { fetchAiExplanation } from '../services/api';

export default function AiBrief({ property }) {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!property?.id) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setBrief(null);

    fetchAiExplanation(property)
      .then((data) => {
        if (!cancelled) setBrief(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? 'Could not load AI brief');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [property?.id]);

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-md bg-gradient-to-r from-violet-600/30 to-detroit-accent/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-200">
          AI brief
        </span>
        {brief?.ai && (
          <span className="text-[10px] text-detroit-muted">Powered by Gemini</span>
        )}
      </div>

      <div className="rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 to-detroit-panel/80 p-4">
        {loading && (
          <p className="animate-pulse text-sm text-detroit-muted">Generating intervention brief…</p>
        )}
        {error && !loading && (
          <p className="text-sm text-red-300">{error}</p>
        )}
        {brief && !loading && (
          <p className="text-sm leading-relaxed text-gray-200">{brief.explanation}</p>
        )}
      </div>
    </section>
  );
}
