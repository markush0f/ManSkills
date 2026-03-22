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
    <main className="relative h-screen w-full overflow-hidden px-3 py-3 text-[var(--text)] md:px-4 md:py-4">
      <div className="pointer-events-none absolute left-[-140px] top-20 h-72 w-72 rounded-full bg-[rgba(217,98,59,0.12)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-120px] top-0 h-80 w-80 rounded-full bg-[rgba(79,143,137,0.12)] blur-3xl" />

      <section
        ref={layoutRef}
        className="grid h-[calc(100vh-24px)] rounded-[24px] border border-[var(--border)] bg-[rgba(6,11,16,0.46)] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl"
        style={{
          gridTemplateColumns: `${sidebarWidth}px ${resizerWidth}px minmax(0, 1fr)`,
        }}
      >
        <div className="min-w-0 overflow-hidden">
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

        <div className="min-w-0 overflow-hidden">
          {isMarketplaceView ? <MarketplaceWorkspace /> : <EditorWorkspace />}
        </div>
      </section>
    </main>
  );
}
