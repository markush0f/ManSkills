import { useIde } from "../../contexts/IdeContext";
import { useIdeLayout } from "../../contexts/IdeLayoutContext";
import { EditorWorkspace } from "../editor/EditorWorkspace";
import { Sidebar } from "../navigation/Sidebar";
import { MarketplaceWorkspace } from "../panels/MarketplaceWorkspace";
import { SettingsWorkspace } from "../panels/SettingsWorkspace";

export function IdeWorkbench() {
  const { isMarketplaceView, isSettingsView } = useIde();
  const {
    isResizing,
    layoutRef,
    resizerWidth,
    resetSidebarWidth,
    sidebarWidth,
    startSidebarResize,
  } = useIdeLayout();

  return (
    <main className="relative h-screen w-full overflow-hidden text-[var(--text)]">
      <section
        ref={layoutRef}
        className="grid h-screen w-full bg-[linear-gradient(180deg,rgba(6,10,14,0.96),rgba(8,13,19,0.98))]"
        style={{
          gridTemplateColumns: `${sidebarWidth}px ${resizerWidth}px minmax(0, 1fr)`,
        }}
      >
        <div className="min-w-0 overflow-hidden border-r border-[var(--border)] bg-[linear-gradient(180deg,rgba(9,14,19,0.98),rgba(7,11,16,0.98))] shadow-[inset_-1px_0_0_rgba(255,255,255,0.02)]">
          <Sidebar />
        </div>

        <div className="flex items-stretch justify-center">
          <button
            aria-label="Redimensionar panel lateral"
            className={`group flex h-full w-full cursor-col-resize items-center justify-center bg-transparent transition ${
              isResizing ? "bg-white/4" : "hover:bg-white/[0.025]"
            }`}
            onDoubleClick={resetSidebarWidth}
            onPointerDown={(event) => {
              event.preventDefault();
              startSidebarResize();
            }}
            title="Arrastra para cambiar el tamaño"
            type="button"
          >
            <span
              className={`h-full w-px transition ${
                isResizing ? "bg-[var(--accent)]" : "bg-[var(--border-soft)] group-hover:bg-white/18"
              }`}
            />
          </button>
        </div>

        <div className="min-w-0 overflow-hidden bg-[linear-gradient(180deg,rgba(8,13,18,0.92),rgba(9,14,19,0.96))]">
          {isMarketplaceView ? (
            <MarketplaceWorkspace />
          ) : isSettingsView ? (
            <SettingsWorkspace />
          ) : (
            <EditorWorkspace />
          )}
        </div>
      </section>
    </main>
  );
}
