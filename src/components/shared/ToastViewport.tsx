import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useUiShell } from "../../contexts/UiShellContext";

function getToastTone(kind: "success" | "error" | "info") {
  if (kind === "success") {
    return {
      border: "border-[rgba(90,185,138,0.28)]",
      dot: "bg-[#5ab98a]",
      surface: "bg-[rgba(90,185,138,0.12)]",
    };
  }

  if (kind === "error") {
    return {
      border: "border-[rgba(207,94,79,0.28)]",
      dot: "bg-[#cf5e4f]",
      surface: "bg-[rgba(207,94,79,0.12)]",
    };
  }

  return {
    border: "border-[rgba(79,168,199,0.22)]",
    dot: "bg-[var(--cyan)]",
    surface: "bg-[rgba(79,168,199,0.1)]",
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
            className={`pointer-events-auto rounded-[16px] border px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-sm ${tone.border} ${tone.surface}`}
            key={toast.id}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[var(--text)]">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-[12px] leading-5 text-[var(--muted)]">{toast.description}</p>
                ) : null}
              </div>

              <button
                aria-label="Dismiss toast"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border border-white/8 bg-white/[0.02] text-[var(--muted)] transition hover:border-white/12 hover:bg-white/[0.05] hover:text-[var(--text)]"
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
