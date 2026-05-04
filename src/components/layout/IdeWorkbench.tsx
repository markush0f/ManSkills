import { useIde } from "../../contexts/IdeContext";
import { useIdeLayout } from "../../contexts/IdeLayoutContext";
import { EditorWorkspace } from "../editor/EditorWorkspace";
import { Sidebar } from "../navigation/Sidebar";
import { MarketplaceWorkspace } from "../panels/MarketplaceWorkspace";
import { SettingsWorkspace } from "../panels/SettingsWorkspace";

export function IdeWorkbench() {
  const { isMarketplaceView, isSettingsView } = useIde();
  const showSidebar = true;
  const {
    effectiveWidth,
    isResizing,
    layoutRef,
    resizerWidth,
    resetSidebarWidth,
    startSidebarResize,
  } = useIdeLayout();

  return (
    <main className="relative h-screen w-full overflow-hidden text-[var(--text)]">
      <section
        ref={layoutRef}
        className="relative grid h-screen w-full bg-[var(--workbench-surface)]"
        style={{
          gridTemplateColumns: showSidebar ? `${effectiveWidth}px minmax(0, 1fr)` : "0px minmax(0, 1fr)",
        }}
      >
        {showSidebar && (
          <div className="min-w-0 overflow-hidden bg-[image:var(--sidebar-bg)] shadow-[inset_-1px_0_0_rgba(255,255,255,0.02)]">
            <Sidebar />
          </div>
        )}

        <div
          className="min-w-0 overflow-hidden bg-[image:var(--editor-bg)]"
          style={showSidebar ? undefined : { gridColumn: "2 / 3" }}
        >
          {isSettingsView ? (
            <SettingsWorkspace />
          ) : isMarketplaceView ? (
            <MarketplaceWorkspace />
          ) : (
            <EditorWorkspace />
          )}
        </div>

        {showSidebar && (
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
              left: `${effectiveWidth - resizerWidth / 2}px`,
              width: `${resizerWidth}px`,
            }}
            title="Arrastra para cambiar el tamaño"
            type="button"
          />
        )}
      </section>
    </main>
  );
}
