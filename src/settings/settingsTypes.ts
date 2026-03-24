import type { IdePreferences } from "../types";

export type UpdatePreferences = (nextPreferences: Partial<IdePreferences>) => void;
