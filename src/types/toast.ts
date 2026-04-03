export type ToastKind = "success" | "error" | "info";

export type Toast = {
  description?: string;
  durationMs?: number;
  id: string;
  kind: ToastKind;
  sticky?: boolean;
  title: string;
};
