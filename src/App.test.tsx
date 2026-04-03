import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("./providers/IdeProvider", () => ({
  IdeProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="ide-provider">{children}</div>
  ),
}));

vi.mock("./components/layout/IdeWorkbench", () => ({
  IdeWorkbench: () => <div>Workbench shell</div>,
}));

import App from "./App";

test("renders the workbench inside the IDE provider", () => {
  render(<App />);

  expect(screen.getByTestId("ide-provider")).toBeInTheDocument();
  expect(screen.getByText("Workbench shell")).toBeInTheDocument();
});
