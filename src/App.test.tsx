import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

const { eventHandlers, invokeMock, listenMock } = vi.hoisted(() => ({
  eventHandlers: new Map<string, (event: { payload: unknown }) => void>(),
  invokeMock: vi.fn(),
  listenMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: invokeMock,
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: listenMock,
}));

vi.mock("@monaco-editor/react", () => ({
  default: function MockEditor({
    onChange,
    value,
  }: {
    onChange?: (value: string) => void;
    value?: string;
  }) {
    return (
      <textarea
        aria-label="Mock editor"
        onChange={(event) => onChange?.(event.target.value)}
        value={value ?? ""}
      />
    );
  },
}));

const baseSkill = {
  id: "/tmp/test-skill/SKILL.md",
  manifestPath: "/tmp/test-skill/SKILL.md",
  name: "Explain Code",
  rootPath: "/tmp/test-skill",
  slug: "explain-code",
  source: "workspace",
  summary: "Debugs code paths",
};

function buildTreeResponse() {
  return {
    durationMs: 12,
    roots: [
      {
        children: [
          {
            children: [],
            file: null,
            id: "skill:/tmp/test-skill/SKILL.md",
            kind: "skill",
            name: baseSkill.name,
            path: baseSkill.rootPath,
            skill: baseSkill,
          },
        ],
        file: null,
        id: "root:/tmp",
        kind: "root",
        name: "tmp",
        path: "/tmp",
        skill: null,
      },
    ],
    scannedRoots: ["/tmp"],
  };
}

async function expandSystemSkillRoot(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByText("tmp"));
}

beforeEach(() => {
  eventHandlers.clear();
  invokeMock.mockReset();
  listenMock.mockReset();
  listenMock.mockImplementation(async (event: string, handler: (event: { payload: unknown }) => void) => {
    eventHandlers.set(event, handler);
    return () => {
      eventHandlers.delete(event);
    };
  });
});

afterEach(() => {
  vi.useRealTimers();
});

test("renders empty editor state and keeps workspace and system skills sections separate", async () => {
  invokeMock.mockResolvedValueOnce(buildTreeResponse());
  const user = userEvent.setup();

  render(<App />);

  expect(await screen.findByText("Workspace")).toBeInTheDocument();
  expect(screen.getByText("System Skills")).toBeInTheDocument();
  await expandSystemSkillRoot(user);
  expect(await screen.findByText("Explain Code")).toBeInTheDocument();
  expect(
    screen.getByText("Todavia no has abierto ningun archivo. Usa la seccion de system skills para empezar."),
  ).toBeInTheDocument();
  expect(screen.getByText("No hay ningun archivo abierto.")).toBeInTheDocument();
});

test("shows a visible retryable error when the initial system skill scan fails", async () => {
  invokeMock.mockRejectedValueOnce(new Error("scan failed"));

  render(<App />);

  expect(await screen.findByText("No se pudieron cargar las skills del sistema.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
});
