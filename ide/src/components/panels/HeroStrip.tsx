import { cardClass, subtleLabelClass } from "../shared/ui";

type HeroStripProps = {
  openTabCount: number;
  diagnosticCount: number;
};

const items = (openTabCount: number, diagnosticCount: number) => [
  { label: "Workspace activo", value: "forja-studio", mark: "WS" },
  { label: "Tabs abiertas", value: String(openTabCount), mark: "TB" },
  { label: "Problemas", value: String(diagnosticCount), mark: "DG" },
  { label: "Modo", value: "Tauri + React", mark: "MD" },
];

export function HeroStrip({ openTabCount, diagnosticCount }: HeroStripProps) {
  return (
    <section className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items(openTabCount, diagnosticCount).map((item) => (
        <div key={item.label} className={`${cardClass} relative overflow-hidden`}>
          <div className="absolute right-4 top-4 rounded-full border border-[var(--border)] bg-white/5 px-2.5 py-1 font-mono text-[10px] tracking-[0.24em] text-[var(--muted)]">
            {item.mark}
          </div>
          <p className={subtleLabelClass}>{item.label}</p>
          <strong
            className="block pr-12 text-xl font-semibold text-[var(--text)]"
            style={{ fontFamily: '"Space Grotesk", "IBM Plex Sans", sans-serif' }}
          >
            {item.value}
          </strong>
          <div className="mt-5 h-2 w-full rounded-full bg-white/8">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-strong))]" />
          </div>
        </div>
      ))}
    </section>
  );
}
