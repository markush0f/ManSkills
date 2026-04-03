import { useEffect, useRef, useState } from "react";
import { useUiShell } from "../contexts/UiShellContext";

const DEFAULT_SIDEBAR_WIDTH = 296;
const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 520;
const MIN_CONTENT_WIDTH = 560;
const RESIZER_WIDTH = 6;

function clampSidebarWidth(width: number, containerWidth?: number) {
  const containerLimit = containerWidth
    ? Math.max(MIN_SIDEBAR_WIDTH, containerWidth - RESIZER_WIDTH - MIN_CONTENT_WIDTH)
    : MAX_SIDEBAR_WIDTH;

  return Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), Math.min(MAX_SIDEBAR_WIDTH, containerLimit));
}

export function useSidebarResize() {
  const { uiState, updateUiState } = useUiShell();
  const layoutRef = useRef<HTMLElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarWidth = uiState.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH;

  function setSidebarWidth(nextWidth: number) {
    updateUiState((current) => ({
      ...current,
      sidebarWidth: nextWidth,
    }));
  }

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const layoutWidth = layoutRef.current?.clientWidth;
      const layoutLeft = layoutRef.current?.getBoundingClientRect().left ?? 0;
      setSidebarWidth(clampSidebarWidth(event.clientX - layoutLeft, layoutWidth));
    };

    const stopResize = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  useEffect(() => {
    const handleResize = () => {
      const layoutWidth = layoutRef.current?.clientWidth;
      setSidebarWidth(clampSidebarWidth(sidebarWidth, layoutWidth));
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [sidebarWidth]);

  return {
    defaultSidebarWidth: DEFAULT_SIDEBAR_WIDTH,
    isResizing,
    isSidebarCompact: sidebarWidth < 250,
    layoutRef,
    resetSidebarWidth: () => setSidebarWidth(DEFAULT_SIDEBAR_WIDTH),
    resizerWidth: RESIZER_WIDTH,
    sidebarWidth,
    startSidebarResize: () => setIsResizing(true),
  };
}
