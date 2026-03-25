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
    <div className="relative z-[1] border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.005))] px-2 py-2">
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-[var(--accent-strong)]">
          <Icon icon="codicon:search" className="h-3.5 w-3.5" />
        </span>
        <TextInput
          className="pl-9"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tree"
          value={query}
        />
      </div>
    </div>
  );
}
