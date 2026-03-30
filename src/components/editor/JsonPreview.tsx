type JsonPreviewProps = {
  content: string;
  compact?: boolean;
};

function JsonValue({
  value,
  depth = 0,
}: {
  value: unknown;
  depth?: number;
}) {
  if (value === null) {
    return <span className="font-mono text-[#d79432]">null</span>;
  }

  if (typeof value === "string") {
    return <span className="font-mono text-[#7cd6d0]">"{value}"</span>;
  }

  if (typeof value === "number") {
    return <span className="font-mono text-[#ffb58c]">{value}</span>;
  }

  if (typeof value === "boolean") {
    return <span className="font-mono text-[#d9623b]">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    return (
      <div className="space-y-2">
        <div className="font-mono text-[var(--muted)]">[{value.length}]</div>
        <div className="space-y-2 border-l border-[var(--border)] pl-4">
          {value.map((item, index) => (
            <div key={`${depth}-${index}`} className="rounded-[8px] border border-[var(--border)] bg-white/[0.03] px-3 py-2">
              <div className="mb-1 font-mono text-xs text-[var(--muted)]">#{index}</div>
              <JsonValue depth={depth + 1} value={item} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);

    return (
      <div className="space-y-2">
        <div className="font-mono text-[var(--muted)]">{"{"}{entries.length}{"}"}</div>
        <div className="space-y-2 border-l border-[var(--border)] pl-4">
          {entries.map(([key, entryValue]) => (
            <div key={`${depth}-${key}`} className="rounded-[8px] border border-[var(--border)] bg-white/[0.03] px-3 py-2">
              <div className="mb-1 font-mono text-sm text-white">{key}</div>
              <JsonValue depth={depth + 1} value={entryValue} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <span className="font-mono text-[var(--muted)]">{String(value)}</span>;
}

export function JsonPreview({ content, compact = false }: JsonPreviewProps) {
  let parsedContent: unknown;
  let parseError: string | null = null;

  try {
    parsedContent = JSON.parse(content) as unknown;
  } catch (error) {
    parseError = error instanceof Error ? error.message : "Unable to parse JSON";
  }

  if (parseError) {
    return (
      <div className="h-full overflow-auto bg-[var(--editor-surface)] px-6 py-5">
        <div className={compact ? "max-w-none" : "mx-auto max-w-3xl"}>
          <div className="rounded-[12px] border border-[#cf5e4f]/30 bg-[linear-gradient(180deg,#cf5e4f14,#cf5e4f0f)] px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.16)]">
            <h2 className="text-lg font-semibold text-[#ffb3a7]">Invalid JSON</h2>
            <p className="mt-2 text-sm text-[#ffd2cb]">{parseError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-[radial-gradient(circle_at_top_right,rgba(79,168,199,0.08),transparent_22%),var(--editor-surface)] px-6 py-5">
      <div className={compact ? "max-w-none" : "mx-auto max-w-3xl"}>
        <div className="mb-5 border-b border-white/[0.04] pb-3">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[rgba(79,168,199,0.18)] bg-[rgba(79,168,199,0.08)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--cyan-strong)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)]" />
            Structured View
          </div>
          <h2 className="text-2xl font-semibold text-white">JSON Preview</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Visual structure of the current JSON document</p>
        </div>
        <JsonValue value={parsedContent} />
      </div>
    </div>
  );
}
