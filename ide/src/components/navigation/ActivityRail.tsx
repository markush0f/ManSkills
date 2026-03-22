import type { SidebarView } from "../../ide/types";
import { railButtonActiveClass, railButtonClass } from "../shared/ui";

type ActivityRailProps = {
  activeSidebar: SidebarView;
  onSelect: (view: SidebarView) => void;
  onShowProblems: () => void;
};

function buttonClass(active: boolean) {
  return `${railButtonClass} ${active ? railButtonActiveClass : ""}`;
}

export function ActivityRail({ activeSidebar, onSelect, onShowProblems }: ActivityRailProps) {
  return (
    <aside className="flex flex-row gap-3 rounded-full border border-[var(--border)] bg-[rgba(16,24,32,0.72)] p-2 shadow-[0_12px_28px_rgba(0,0,0,0.22)] backdrop-blur-xl xl:min-h-[70vh] xl:flex-col xl:items-center xl:self-start xl:rounded-[30px] xl:px-2 xl:py-3">
      <button
        className={buttonClass(activeSidebar === "explorer")}
        onClick={() => onSelect("explorer")}
      >
        EX
      </button>
      <button
        className={buttonClass(activeSidebar === "search")}
        onClick={() => onSelect("search")}
      >
        SR
      </button>
      <button
        className={buttonClass(activeSidebar === "problems")}
        onClick={onShowProblems}
      >
        PG
      </button>
    </aside>
  );
}
