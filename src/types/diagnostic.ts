import type { DiagnosticLevel } from "./diagnostic-level";

export type Diagnostic = {
  fileId: string;
  line: number;
  message: string;
  level: DiagnosticLevel;
};
