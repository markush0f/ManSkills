import { Icon, addCollection } from "@iconify/react";
import { icons as codiconIcons } from "@iconify-json/codicon";
import { TextInput } from "../../shared/formControls";

addCollection(codiconIcons);

type SidebarSearchProps = {
  query: string;
  setQuery: (value: string) => void;
};

export function SidebarSearch({ query, setQuery }: SidebarSearchProps) {
  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-[var(--accent-strong)]">
        <Icon icon="codicon:search" className="h-3.5 w-3.5" />
      </span>
      <TextInput
        className="h-10 rounded-[12px] border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] pl-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search tree"
        value={query}
      />
    </div>
  );
}
