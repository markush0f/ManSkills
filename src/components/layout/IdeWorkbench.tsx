import { useIde } from "../../contexts/IdeContext";
import { useIdeLayout } from "../../contexts/IdeLayoutContext";
import { EditorWorkspace } from "../editor/EditorWorkspace";
import { Sidebar } from "../navigation/Sidebar";
import { MarketplaceWorkspace } from "../panels/MarketplaceWorkspace";

export function IdeWorkbench() {
  const { isMarketplaceView } = useIde();
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
      <div className="pointer-events-none absolute left-[-140px] top-20 h-72 w-72 rounded-full bg-[rgba(217,98,59,0.12)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-120px] top-0 h-80 w-80 rounded-full bg-[rgba(79,143,137,0.12)] blur-3xl" />

      <section
        ref={layoutRef}
        className="grid h-screen w-full bg-[linear-gradient(180deg,rgba(8,13,18,0.84),rgba(6,10,14,0.72))]"
        style={{
          gridTemplateColumns: `${sidebarWidth}px ${resizerWidth}px minmax(0, 1fr)`,
        }}
      >
        <div className="min-w-0 overflow-hidden border-r border-[var(--border)] bg-[rgba(9,15,20,0.64)]">
          <Sidebar />
        </div>

        <div className="flex items-stretch justify-center">
          <button
            aria-label="Redimensionar panel lateral"
            className={`group flex h-full w-full cursor-col-resize items-center justify-center bg-transparent transition ${
              isResizing ? "bg-white/4" : "hover:bg-white/[0.03]"
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
                isResizing ? "bg-[var(--accent)]" : "bg-[var(--border)] group-hover:bg-white/18"
              }`}
            />
          </button>
        </div>

        <div className="min-w-0 overflow-hidden bg-[rgba(9,15,20,0.42)]">
          {isMarketplaceView ? <MarketplaceWorkspace /> : <EditorWorkspace />}
        </div>
      </section>
    </main>
  );
}
