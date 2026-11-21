/** Soft animated gradient backdrop placed behind page headers. */
export function PageBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-[76px] -z-10 h-[640px] overflow-hidden">
      <div className="bg-grid absolute inset-0" />
      <div className="animate-blob absolute -left-24 top-0 size-96 rounded-full bg-indigo-400/25 blur-3xl" />
      <div className="animate-blob absolute -right-24 top-24 size-96 rounded-full bg-violet-400/20 blur-3xl [animation-delay:-9s]" />
    </div>
  );
}
