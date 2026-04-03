import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useUiShell } from "../../contexts/UiShellContext";

function getToastTone(kind: "success" | "error" | "info") {
  if (kind === "success") {
    return {
      border: "border-[var(--toast-success-border)]",
      dot: "bg-[var(--toast-success-dot)]",
      surface: "bg-[var(--toast-success-bg)]",
    };
  }

  if (kind === "error") {
    return {
      border: "border-[var(--toast-error-border)]",
      dot: "bg-[var(--toast-error-dot)]",
      surface: "bg-[var(--toast-error-bg)]",
    };
  }

  return {
    border: "border-[var(--toast-info-border)]",
    dot: "bg-[var(--toast-info-dot)]",
    surface: "bg-[var(--toast-info-bg)]",
  };
}

export function ToastViewport() {
  const { dismissToast, toasts } = useUiShell();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => {
        const tone = getToastTone(toast.kind);

        return (
          <article
            className={`pointer-events-auto rounded-[16px] border px-4 py-3 shadow-[var(--toast-shadow)] backdrop-blur-sm ${tone.border} ${tone.surface}`}
            key={toast.id}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[var(--text-primary)]">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-[12px] leading-5 text-[var(--text-muted)]">{toast.description}</p>
                ) : null}
              </div>

              <button
                aria-label="Dismiss toast"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-[var(--toast-dismiss-border)] bg-[var(--toast-dismiss-bg)] text-[var(--text-muted)] transition hover:border-[var(--toast-dismiss-border-hover)] hover:bg-[var(--toast-dismiss-bg-hover)] hover:text-[var(--text-primary)]"
                onClick={() => dismissToast(toast.id)}
                type="button"
              >
                <XIcon className="h-4 w-4" weight="bold" />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
