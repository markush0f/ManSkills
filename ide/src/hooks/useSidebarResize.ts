import { useEffect, useRef, useState } from "react";

const SIDEBAR_WIDTH_KEY = "skills-ide:sidebar-width";
const DEFAULT_SIDEBAR_WIDTH = 296;
const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 520;
const MIN_CONTENT_WIDTH = 480;
const RESIZER_WIDTH = 6;

function clampSidebarWidth(width: number, containerWidth?: number) {
  const containerLimit = containerWidth
    ? Math.max(MIN_SIDEBAR_WIDTH, containerWidth - RESIZER_WIDTH - MIN_CONTENT_WIDTH)
    : MAX_SIDEBAR_WIDTH;

  return Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), Math.min(MAX_SIDEBAR_WIDTH, containerLimit));
}

export function useSidebarResize() {
  const layoutRef = useRef<HTMLElement | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_SIDEBAR_WIDTH;
    }

    const storedWidth = Number(window.localStorage.getItem(SIDEBAR_WIDTH_KEY));
    return Number.isFinite(storedWidth) && storedWidth > 0 ? storedWidth : DEFAULT_SIDEBAR_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
  }, [sidebarWidth]);

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
      setSidebarWidth((current) => clampSidebarWidth(current, layoutWidth));
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

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
