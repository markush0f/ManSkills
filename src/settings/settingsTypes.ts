import type { IdePreferences } from "../ide/types";

export type UpdatePreferences = (nextPreferences: Partial<IdePreferences>) => void;
