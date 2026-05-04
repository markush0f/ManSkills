import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { TextInput } from "../../shared/formControls";

type SidebarSearchProps = {
  query: string;
  setQuery: (value: string) => void;
};

export function SidebarSearch({ query, setQuery }: SidebarSearchProps) {
  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-8 items-center justify-center text-[var(--muted)]">
        <MagnifyingGlassIcon className="h-4 w-4" weight="bold" />
      </span>
      <TextInput
        className="h-8 rounded-[10px] border-[var(--border)] bg-white/[0.015] px-2.5 pl-8 shadow-none focus:bg-white/[0.03]"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar skills o archivos"
        value={query}
      />
    </div>
  );
}
