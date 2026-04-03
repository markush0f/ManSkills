import { act, renderHook, waitFor } from "@testing-library/react";
import {
  DEFAULT_PERSISTED_UI_STATE,
  PERSISTED_UI_STATE_KEY,
  usePersistentUiState,
} from "./usePersistentUiState";

describe("usePersistentUiState", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("hydrates partial persisted data and preserves defaults", () => {
    window.localStorage.setItem(
      PERSISTED_UI_STATE_KEY,
      JSON.stringify({
        marketplace: { query: "rust" },
        settings: { selectedCategory: "workspace" },
        version: 99,
      }),
    );

    const { result } = renderHook(() => usePersistentUiState());

    expect(result.current.uiState.version).toBe(1);
    expect(result.current.uiState.marketplace.query).toBe("rust");
    expect(result.current.uiState.settings.selectedCategory).toBe("workspace");
    expect(result.current.uiState.sidebar).toEqual(DEFAULT_PERSISTED_UI_STATE.sidebar);
  });

  test("persists updates into the unified storage key", async () => {
    const { result } = renderHook(() => usePersistentUiState());

    act(() => {
      result.current.updateUiState((current) => ({
        ...current,
        marketplace: {
          ...current.marketplace,
          query: "search term",
        },
        sidebarWidth: 320,
        workspaceView: "marketplace",
      }));
    });

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(PERSISTED_UI_STATE_KEY) ?? "{}")).toMatchObject({
        marketplace: { query: "search term" },
        sidebarWidth: 320,
        workspaceView: "marketplace",
      });
    });
  });
});
