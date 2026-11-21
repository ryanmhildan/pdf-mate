/**
 * Placeholder for ad units (e.g. Google AdSense).
 * Reserves fixed height to avoid layout shift. Hidden for Pro users later.
 */
export function AdSlot({ className = "" }: { className?: string }) {
  return (
    <aside
      aria-label="Iklan"
      className={`flex h-24 items-center justify-center rounded-2xl border border-dashed border-border bg-surface text-xs font-semibold uppercase tracking-widest text-muted-foreground ${className}`}
    >
      Ruang iklan
    </aside>
  );
}
