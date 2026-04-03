import { act, renderHook } from "@testing-library/react";
import { useToastQueue } from "./useToastQueue";

describe("useToastQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("auto-dismisses non-sticky toasts after their duration", () => {
    const { result } = renderHook(() => useToastQueue());

    act(() => {
      result.current.pushToast({
        durationMs: 500,
        kind: "success",
        title: "Saved",
      });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  test("keeps sticky toasts visible until dismissed manually", () => {
    const { result } = renderHook(() => useToastQueue());

    let toastId = "";

    act(() => {
      toastId = result.current.pushToast({
        kind: "error",
        sticky: true,
        title: "Failed",
      });
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.dismissToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});
