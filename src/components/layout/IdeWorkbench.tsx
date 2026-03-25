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
        className="relative grid h-screen w-full bg-[linear-gradient(180deg,rgba(6,10,14,0.96),rgba(8,13,19,0.98))]"
        style={{
          gridTemplateColumns: `${sidebarWidth}px minmax(0, 1fr)`,
        }}
      >
        <div className="min-w-0 overflow-hidden bg-[linear-gradient(180deg,rgba(9,14,19,0.98),rgba(7,11,16,0.98))] shadow-[inset_-1px_0_0_rgba(255,255,255,0.02)]">
          <Sidebar />
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

        <button
          aria-label="Redimensionar panel lateral"
          className={`absolute inset-y-0 z-20 cursor-col-resize bg-transparent transition ${
            isResizing ? "bg-white/[0.03]" : "hover:bg-transparent"
          }`}
          onDoubleClick={resetSidebarWidth}
          onPointerDown={(event) => {
            event.preventDefault();
            startSidebarResize();
          }}
          style={{
            left: `${sidebarWidth - resizerWidth / 2}px`,
            width: `${resizerWidth}px`,
          }}
          title="Arrastra para cambiar el tamaño"
          type="button"
        />
      </section>
    </main>
  );
}
