import { useCallback, useEffect, useRef, useState } from "react";
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
  const [liveWidth, setLiveWidth] = useState<number | null>(null);
  const sidebarWidth = uiState.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH;
  const effectiveWidth = liveWidth ?? sidebarWidth;

  const setSidebarWidth = useCallback(
    (nextWidth: number) => {
      updateUiState((current) => {
        if (current.sidebarWidth === nextWidth) {
          return current;
        }

        return { ...current, sidebarWidth: nextWidth };
      });
    },
    [updateUiState],
  );

  const startSidebarResize = useCallback(() => {
    setIsResizing(true);
    setLiveWidth(sidebarWidth);
  }, [sidebarWidth]);

  const resetSidebarWidth = useCallback(() => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
  }, [setSidebarWidth]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    let rafId: number | null = null;

    const handlePointerMove = (event: PointerEvent) => {
      if (rafId !== null) {
        return;
      }

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const layoutWidth = layoutRef.current?.clientWidth;
        const layoutLeft = layoutRef.current?.getBoundingClientRect().left ?? 0;
        setLiveWidth(clampSidebarWidth(event.clientX - layoutLeft, layoutWidth));
      });
    };

    const stopResize = () => {
      setIsResizing(false);
      if (liveWidth !== null) {
        setSidebarWidth(liveWidth);
        setLiveWidth(null);
      }
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
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, liveWidth, setSidebarWidth]);

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
  }, [sidebarWidth, setSidebarWidth]);

  return {
    defaultSidebarWidth: DEFAULT_SIDEBAR_WIDTH,
    effectiveWidth,
    isResizing,
    isSidebarCompact: effectiveWidth < 250,
    layoutRef,
    resetSidebarWidth,
    resizerWidth: RESIZER_WIDTH,
    sidebarWidth,
    startSidebarResize,
  };
}
