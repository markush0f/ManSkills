import { useEffect, useMemo, useState } from "react";
import { TextareaInput } from "../components/shared/formControls";
import { SkeletonBlock } from "../components/shared/SkeletonBlock";
import { ghostButtonClass } from "../components/shared/ui";
import { Section } from "./SettingsRows";
import { useSettings } from "./SettingsContext";
import { matchesSearch } from "./settingsUtils";

type SkillsDraft = {
  customScanRoots: string;
  globalRoots: string;
  hiddenDirectories: string;
  providerDirectories: string;
};

export function hasSkillsSettingsResults(query: string) {
  return (
    matchesSearch(query, "Skills: Global Roots", ".markus, .claude, .codex") ||
    matchesSearch(query, "Skills: Provider Directories", "markus, codex, claude") ||
    matchesSearch(query, "Skills: Hidden Directories", "node_modules, dist, tmp") ||
    matchesSearch(query, "Skills: Custom Scan Roots", "Additional filesystem roots for scanning")
  );
}

function toDraftValue(values: string[]) {
  return values.join("\n");
}

function parseDraftValue(value: string) {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function createDraft(settings: {
  customScanRoots: string[];
  globalRoots: string[];
  hiddenDirectories: string[];
  providerDirectories: string[];
}): SkillsDraft {
  return {
    customScanRoots: toDraftValue(settings.customScanRoots),
    globalRoots: toDraftValue(settings.globalRoots),
    hiddenDirectories: toDraftValue(settings.hiddenDirectories),
    providerDirectories: toDraftValue(settings.providerDirectories),
  };
}

function removeDraftEntry(value: string, entryToRemove: string) {
  return toDraftValue(
    parseDraftValue(value).filter((entry) => entry.toLowerCase() !== entryToRemove.toLowerCase()),
  );
}

export function SkillsSettingsSection() {
  const {
    query,
    refreshSkillClassificationSettings,
    saveSkillClassificationSettings,
    skillClassificationSettings,
    skillClassificationSettingsError,
    skillClassificationSettingsLoading,
  } = useSettings();
  const [draft, setDraft] = useState<SkillsDraft>(() => createDraft(skillClassificationSettings));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(createDraft(skillClassificationSettings));
  }, [skillClassificationSettings]);

  const hasAnyVisibleSettings = useMemo(
    () => hasSkillsSettingsResults(query),
    [query],
  );
  const hiddenDirectoryEntries = useMemo(() => parseDraftValue(draft.hiddenDirectories), [draft.hiddenDirectories]);

  if (!hasAnyVisibleSettings) {
    return null;
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await saveSkillClassificationSettings({
        customScanRoots: parseDraftValue(draft.customScanRoots),
        globalRoots: parseDraftValue(draft.globalRoots),
        hiddenDirectories: parseDraftValue(draft.hiddenDirectories),
        providerDirectories: parseDraftValue(draft.providerDirectories),
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    setDraft({
      customScanRoots: "",
      globalRoots: "",
      hiddenDirectories: "",
      providerDirectories: "",
    });
  }

  return (
    <Section>
      <div className="border-l-2 border-l-transparent px-4 py-3">
        <p className="text-[13px] text-[var(--text)]">Skills: Classification Rules</p>
        <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
          Edit the active rules for global roots, provider names, hidden directories, and extra scan roots.
          Built-in defaults are loaded here automatically so you can adjust them directly.
        </p>
      </div>

      {skillClassificationSettingsLoading ? (
        <div className="space-y-3 border-t border-[var(--border)] px-4 py-3">
          <SkeletonBlock className="h-3 w-28" />
          <SkeletonBlock className="h-24 w-full" />
        </div>
      ) : null}

      {skillClassificationSettingsError ? (
        <div className="border-t border-[var(--border)] px-4 py-3 text-[12px] text-[#ffb3a7]">
          {skillClassificationSettingsError}
        </div>
      ) : null}

      {!skillClassificationSettingsLoading && matchesSearch(query, "Skills: Global Roots", ".markus, .claude, .codex") && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <p className="text-[13px] text-[var(--text)]">Skills: Global Roots</p>
          <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
            One per line. Use this for hidden roots that should appear under Global, like <code className="mx-1 rounded bg-white/[0.06] px-1 py-0.5 text-[11px]">.markus</code>.
          </p>
          <div className="mt-3">
            <TextareaInput
              onChange={(event) => setDraft((current) => ({ ...current, globalRoots: event.target.value }))}
              placeholder={".markus\n.internal-tools"}
              spellCheck={false}
              value={draft.globalRoots}
            />
          </div>
        </div>
      )}

      {!skillClassificationSettingsLoading && matchesSearch(query, "Skills: Provider Directories", "markus, codex, claude") && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <p className="text-[13px] text-[var(--text)]">Skills: Provider Directories</p>
          <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
            One per line. These names are treated as provider buckets in the sidebar, even if they are not built in.
          </p>
          <div className="mt-3">
            <TextareaInput
              onChange={(event) => setDraft((current) => ({ ...current, providerDirectories: event.target.value }))}
              placeholder={"markus\nmy-provider"}
              spellCheck={false}
              value={draft.providerDirectories}
            />
          </div>
        </div>
      )}

      {!skillClassificationSettingsLoading && matchesSearch(query, "Skills: Hidden Directories", "node_modules, dist, tmp") && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <p className="text-[13px] text-[var(--text)]">Skills: Hidden Directories</p>
          <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
            One per line. These directories are skipped during skill scanning and file listing.
            You can also add entries here by right-clicking folders in the skills sidebar.
          </p>
          <div className="mt-3">
            <TextareaInput
              onChange={(event) => setDraft((current) => ({ ...current, hiddenDirectories: event.target.value }))}
              placeholder={"coverage-cache\nout"}
              spellCheck={false}
              value={draft.hiddenDirectories}
            />
          </div>
          {hiddenDirectoryEntries.length > 0 ? (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Current Entries</p>
              <div className="flex flex-wrap gap-2">
                {hiddenDirectoryEntries.map((entry) => (
                  <button
                    key={entry}
                    className="rounded-full border border-[var(--border)] bg-white/[0.04] px-2.5 py-1 text-[11px] text-[var(--text)] transition hover:border-[var(--border-strong)] hover:bg-white/[0.07]"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        hiddenDirectories: removeDraftEntry(current.hiddenDirectories, entry),
                      }))}
                    type="button"
                  >
                    {entry} x
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {!skillClassificationSettingsLoading && matchesSearch(query, "Skills: Custom Scan Roots", "Additional filesystem roots for scanning") && (
        <div className="border-t border-[var(--border)] px-4 py-3">
          <p className="text-[13px] text-[var(--text)]">Skills: Custom Scan Roots</p>
          <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
            One absolute path per line. Use this when your skills live outside the default workspace or home provider locations.
          </p>
          <div className="mt-3">
            <TextareaInput
              onChange={(event) => setDraft((current) => ({ ...current, customScanRoots: event.target.value }))}
              placeholder={"C:/skills\nD:/company/skills"}
              spellCheck={false}
              value={draft.customScanRoots}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] px-4 py-3">
        <button className={ghostButtonClass} onClick={() => void refreshSkillClassificationSettings()} type="button">
          Reload
        </button>
        <button className={ghostButtonClass} onClick={handleReset} type="button">
          Clear Draft
        </button>
        <button
          className="rounded-[10px] border border-[var(--border)] bg-[var(--accent)] px-3 py-1.5 text-[12px] text-white transition hover:brightness-110 disabled:opacity-60"
          disabled={isSaving || skillClassificationSettingsLoading}
          onClick={() => void handleSave()}
          type="button"
        >
          {isSaving ? "Saving..." : "Save Rules"}
        </button>
      </div>
    </Section>
  );
}
