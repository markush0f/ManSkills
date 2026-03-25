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
      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-8 items-center justify-center text-[var(--muted)]">
        <Icon icon="codicon:search" className="h-3.5 w-3.5" />
      </span>
      <TextInput
        className="h-8 rounded-none border-[var(--border)] bg-white/[0.015] px-2 pl-8 shadow-none focus:bg-white/[0.03]"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search tree"
        value={query}
      />
    </div>
  );
}
