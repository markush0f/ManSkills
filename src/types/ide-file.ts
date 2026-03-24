import type { Language } from "./language";

export type IdeFile = {
  id: string;
  path: string;
  language: Language;
  content: string;
  savedContent: string;
};
