import type { ReactNode } from "react";
import { cardClass } from "./ui";

type EmptyStateProps = {
  action?: ReactNode;
  eyebrow?: string;
  message: string;
  title: string;
};

export function EmptyState({ action, eyebrow, message, title }: EmptyStateProps) {
  return (
    <div className={cardClass}>
      {eyebrow ? (
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">{eyebrow}</p>
      ) : null}
      <h2 className="mt-3 text-[24px] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">{title}</h2>
      <p className="mt-3 text-[13px] leading-6 text-[#c1ccd7]">{message}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
