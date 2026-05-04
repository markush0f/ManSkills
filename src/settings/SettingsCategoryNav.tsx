import { TextInput } from "../components/shared/formControls";
import type { SettingsCategory } from "./settingsCategories";

function CategoryButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center gap-2 rounded-r-[10px] border-l px-3 py-2.5 text-left text-[12px] transition ${
        active
          ? "border-[var(--settings-category-active-border)] bg-[image:var(--settings-category-active-bg)] text-[var(--text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
          : "border-transparent text-[var(--muted)] hover:bg-[image:var(--settings-category-hover-bg)] hover:text-[var(--text)]"
      }`}
      onClick={onClick}
      type="button"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-[var(--accent)] shadow-[0_0_10px_rgba(217,98,59,0.42)]" : "bg-[var(--cyan)]/35"
        }`}
      />
      {label}
    </button>
  );
}

export function SettingsCategoryNav({
  categories,
  query,
  selectedCategory,
  setQuery,
  setSelectedCategory,
}: {
  categories: Array<{ id: SettingsCategory; label: string }>;
  query: string;
  selectedCategory: SettingsCategory;
  setQuery: (value: string) => void;
  setSelectedCategory: (category: SettingsCategory) => void;
}) {
  return (
    <aside className="border-b border-[var(--border)] bg-[image:var(--settings-nav-bg)] xl:border-b-0 xl:border-r">
      <div className="border-b border-[var(--border)] px-3 py-3">
        <div className="relative">
          <TextInput
            className="bg-black/20 pr-10"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar ajustes"
            value={query}
          />
          <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[var(--muted)]">
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7.25 11.5a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5ZM10.5 10.5 13 13"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.3"
              />
            </svg>
          </span>
        </div>
      </div>

      <div className="space-y-1 py-2">
        {categories.map((category) => (
          <CategoryButton
            key={category.id}
            active={selectedCategory === category.id}
            label={category.label}
            onClick={() => setSelectedCategory(category.id)}
          />
        ))}
      </div>
    </aside>
  );
}
