import { useEffect, useRef } from "react";

export type ContextMenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
};

type ContextMenuProps = {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
};

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 40 - 16);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 flex flex-col rounded-[8px] border border-white/[0.08] bg-[var(--sidebar-surface)] py-1 shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
      style={{ left: adjustedX, top: adjustedY }}
      role="menu"
    >
      {items.map((item, i) => (
        <button
          key={i}
          className="flex items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--text)] transition hover:bg-white/[0.05]"
          onClick={() => {
            item.onClick();
            onClose();
          }}
          type="button"
        >
          {item.icon && (
            <span className="inline-flex h-4 w-4 items-center justify-center text-[var(--accent-strong)]">
              {item.icon}
            </span>
          )}
          {item.label}
        </button>
      ))}
    </div>
  );
}
