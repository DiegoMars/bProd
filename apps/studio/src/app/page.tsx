export default function Page() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Welcome 👋</h2>

      <div className="rounded-xl border border-white/10 bg-[color:var(--color-background)]/60 p-6">
        <p className="text-sm text-[color:var(--color-text)]/80">
          This is your admin studio. Use the button below to manage collections.
        </p>

        <div className="mt-4">
          <a
            href="/collections"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-text hover:bg-secondary hover:text-background transition"
          >
            Open Collections
          </a>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 p-4">
          <h3 className="font-medium text-primary">Next steps</h3>
          <ul className="mt-2 list-disc pl-5 text-sm [&>li]:mt-1">
            <li>Create a collection</li>
            <li>Upload photos (multi-file)</li>
            <li>Drag to reorder and save</li>
          </ul>
        </div>
        <div className="rounded-lg border border-white/10 p-4">
          <h3 className="font-medium text-primary">Palette</h3>
          <div className="mt-3 flex gap-2">
            <div className="h-8 w-8 rounded bg-background border" title="background" />
            <div className="h-8 w-8 rounded bg-primary" title="primary" />
            <div className="h-8 w-8 rounded bg-secondary" title="secondary" />
            <div className="h-8 w-8 rounded bg-accent" title="accent" />
          </div>
        </div>
      </section>
    </div>
  );
}
