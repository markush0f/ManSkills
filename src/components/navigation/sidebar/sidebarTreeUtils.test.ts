import type { SystemSkill, SystemSkillTreeNode } from "../../../types";
import {
  buildGlobalSystemSkillTree,
  buildProjectSystemSkillTree,
  buildProviderSkillGroups,
  classifySystemSkillSection,
  reshapeSystemSkillRootsForDisplay,
} from "./sidebarTreeUtils";

const customSkillSettings = {
  customScanRoots: [],
  globalRoots: [".markus"],
  hiddenDirectories: [],
  providerDirectories: ["markus"],
};

test("compacts system skill roots into a single display path", () => {
  const nodes = reshapeSystemSkillRootsForDisplay([
    createSkillsRoot("root:claude", "C:/Users/abram/.claude/skills", [createSkillNode("claude-skill")]),
    createSkillsRoot("root:agents", "C:/Users/abram/Desktop/.agents/skills", [createSkillNode("agents-skill")]),
  ]);

  expect(nodes).toHaveLength(2);
  expect(nodes[0]?.name).toBe("abram/.claude");
  expect(nodes[0]?.path).toBe("C:/Users/abram/.claude");
  expect(nodes[1]?.name).toBe("abram/Desktop/.agents");
  expect(nodes[1]?.path).toBe("C:/Users/abram/Desktop/.agents");
});

test("merges duplicate compact roots by their parent directory path", () => {
  const nodes = reshapeSystemSkillRootsForDisplay([
    createSkillsRoot("root:one", "C:/Users/abram/.claude/skills", [createSkillNode("one")]),
    createSkillsRoot("root:two", "C:/Users/abram/.claude/skills", [createSkillNode("two")]),
  ]);

  expect(nodes).toHaveLength(1);
  expect(nodes[0]?.name).toBe("abram/.claude");
  expect(nodes[0]?.children.map((child) => child.name)).toEqual(["one", "two"]);
});

test("groups provider skills by git project root when hidden folders live inside the repo", () => {
  const groups = buildProviderSkillGroups(
    [
      createSystemSkill("release-helper", {
        gitRepositoryRootPath: "C:/Users/abram/Desktop/project-one",
        rootPath: "C:/Users/abram/Desktop/project-one/.agents/skills/release-helper",
      }),
      createSystemSkill("deploy-helper", {
        gitRepositoryRootPath: "C:/Users/abram/Desktop/project-one",
        rootPath: "C:/Users/abram/Desktop/project-one/.agents/skills/deploy-helper",
      }),
    ],
    "",
  );

  expect(groups).toHaveLength(1);
  expect(groups[0]?.label).toBe("Agents");
  expect(groups[0]?.folders).toHaveLength(1);
  expect(groups[0]?.folders[0]?.label).toBe("abram/Desktop/project-one");
  expect(groups[0]?.folders[0]?.path).toBe("C:/Users/abram/Desktop/project-one");
  expect(groups[0]?.folders[0]?.section).toBe("project");
  expect(groups[0]?.folders[0]?.globalRootLabel).toBeNull();
  expect(groups[0]?.folders[0]?.globalRelativePath).toBeNull();
  expect(groups[0]?.folders[0]?.skills.map((skill) => skill.name)).toEqual([
    "deploy-helper",
    "release-helper",
  ]);
});

test("groups non-git provider skills by their skills container parent", () => {
  const groups = buildProviderSkillGroups(
    [
      createSystemSkill("claude-helper", {
        rootPath: "C:/Users/abram/.claude/skills/claude-helper",
      }),
    ],
    "",
  );

  expect(groups).toHaveLength(1);
  expect(groups[0]?.folders).toHaveLength(1);
  expect(groups[0]?.folders[0]?.label).toBe(".claude");
  expect(groups[0]?.folders[0]?.path).toBe("C:/Users/abram/.claude");
  expect(groups[0]?.folders[0]?.section).toBe("global");
  expect(groups[0]?.folders[0]?.globalRootLabel).toBe(".claude");
  expect(groups[0]?.folders[0]?.globalRelativePath).toBeNull();
});

test("keeps workspace .agents skills under Agents and orders Agents first", () => {
  const groups = buildProviderSkillGroups(
    [
      createSystemSkill("workspace-agent-one", {
        source: "workspace",
        rootPath: "C:/Users/abram/Desktop/app-one/.agents/skills/workspace-agent-one",
        gitRepositoryRootPath: "C:/Users/abram/Desktop/app-one",
      }),
      createSystemSkill("workspace-agent-two", {
        source: "workspace",
        rootPath: "C:/Users/abram/Desktop/app-two/.agents/skills/workspace-agent-two",
        gitRepositoryRootPath: "C:/Users/abram/Desktop/app-two",
      }),
      createSystemSkill("workspace-misc", {
        source: "workspace",
        rootPath: "C:/Users/abram/Desktop/misc-skill",
      }),
    ],
    "",
  );

  expect(groups.map((group) => group.key)).toEqual(["agents", "workspace"]);
  expect(groups[0]?.folders.map((folder) => folder.label)).toEqual([
    "abram/Desktop/app-one",
    "abram/Desktop/app-two",
  ]);
  expect(groups[0]?.folders.every((folder) => folder.section === "project")).toBe(true);
});

test("keeps global hidden folders after project folders inside the same provider", () => {
  const groups = buildProviderSkillGroups(
    [
      createSystemSkill("project-agent", {
        rootPath: "C:/Users/abram/Desktop/app-one/.agents/skills/project-agent",
        gitRepositoryRootPath: "C:/Users/abram/Desktop/app-one",
      }),
      createSystemSkill("hidden-agent", {
        rootPath: "C:/Users/abram/.agents/skills/hidden-agent",
      }),
    ],
    "",
  );

  expect(groups).toHaveLength(1);
  expect(groups[0]?.folders.map((folder) => folder.section)).toEqual(["project", "global"]);
  expect(groups[0]?.folders.map((folder) => folder.label)).toEqual([
    "abram/Desktop/app-one",
    ".agents",
  ]);
});

test("classifies hidden provider paths as global only when outside a git project root", () => {
  expect(
    classifySystemSkillSection(
      createSystemSkill("global-claude", {
        rootPath: "C:/Users/abram/.claude/skills/global-claude",
      }),
    ),
  ).toBe("global");

  expect(
    classifySystemSkillSection(
      createSystemSkill("project-agent", {
        rootPath: "//?/C:/Users/abram/Desktop/app-one/.agents/skills/project-agent",
        gitRepositoryRootPath: "C:/Users/abram/Desktop/app-one",
      }),
    ),
  ).toBe("project");
});

test("separates project and global system skill trees", () => {
  const mixedTree = reshapeSystemSkillRootsForDisplay([
    createSkillsRoot("root:project", "C:/Users/abram/Desktop/app-one/skills", [
      createSkillNode("project-agent", {
        rootPath: "C:/Users/abram/Desktop/app-one/skills/project-agent",
        gitRepositoryRootPath: "C:/Users/abram/Desktop/app-one",
      }),
    ]),
    createSkillsRoot("root:global", "C:/Users/abram/.claude/skills", [
      createSkillNode("global-claude", {
        rootPath: "C:/Users/abram/.claude/skills/global-claude",
      }),
    ]),
  ]);

  const projectTree = buildProjectSystemSkillTree(mixedTree);
  const globalTree = buildGlobalSystemSkillTree(mixedTree);

  expect(projectTree).toHaveLength(1);
  expect(projectTree[0]?.name).toBe("app-one");
  expect(projectTree[0]?.children.map((child) => child.name)).toEqual(["project-agent"]);

  expect(globalTree).toHaveLength(1);
  expect(globalTree[0]?.name).toBe(".claude");
  expect(globalTree[0]?.children.map((child) => child.name)).toEqual(["global-claude"]);
});

test("strips windows extended path prefixes from compact global labels", () => {
  const groups = buildProviderSkillGroups(
    [
      createSystemSkill("codex-cache", {
        rootPath: "//?/C:/Users/abram/.codex/tmp/plugins/plugins/codex-cache/skill",
      }),
    ],
    "",
  );

  expect(groups).toHaveLength(1);
  expect(groups[0]?.folders[0]?.label).toBe(".codex/tmp/plugins/plugins/codex-cache");
  expect(groups[0]?.folders[0]?.globalRootLabel).toBe(".codex");
  expect(groups[0]?.folders[0]?.globalRelativePath).toBe("tmp/plugins/plugins/codex-cache");
});

test("classifies configured custom global roots as global", () => {
  expect(
    classifySystemSkillSection(
      createSystemSkill("global-markus", {
        rootPath: "C:/Users/abram/.markus/skills/global-markus",
      }),
      customSkillSettings,
    ),
  ).toBe("global");
});

test("groups configured provider directories under a custom provider label", () => {
  const groups = buildProviderSkillGroups(
    [
      createSystemSkill("markus-helper", {
        rootPath: "C:/Users/abram/projects/markus/skills/markus-helper",
        gitRepositoryRootPath: "C:/Users/abram/projects/markus",
      }),
    ],
    "",
    customSkillSettings,
  );

  expect(groups).toHaveLength(1);
  expect(groups[0]?.key).toBe("markus");
  expect(groups[0]?.label).toBe("Markus");
});

test("classifies WSL global skill paths as global with compact labels", () => {
  const groups = buildProviderSkillGroups(
    [
      createSystemSkill("claude-wsl", {
        rootPath: "//wsl$/Ubuntu/home/abram/.claude/skills/claude-wsl",
      }),
    ],
    "",
  );

  expect(groups).toHaveLength(1);
  expect(groups[0]?.folders[0]?.label).toBe(".claude");
  expect(groups[0]?.folders[0]?.globalRootLabel).toBe(".claude");
  expect(classifySystemSkillSection(createSystemSkill("claude-wsl", {
    rootPath: "//wsl$/Ubuntu/home/abram/.claude/skills/claude-wsl",
  }))).toBe("global");
});

test("compacts WSL project paths using the distro home prefix", () => {
  const groups = buildProviderSkillGroups(
    [
      createSystemSkill("project-agent", {
        source: "workspace",
        rootPath: "//wsl.localhost/Ubuntu/home/abram/project-one/.agents/skills/project-agent",
        gitRepositoryRootPath: "//wsl.localhost/Ubuntu/home/abram/project-one",
      }),
    ],
    "",
  );

  expect(groups).toHaveLength(1);
  expect(groups[0]?.folders[0]?.label).toBe("abram/project-one");
  expect(groups[0]?.folders[0]?.section).toBe("project");
});

function createSkillsRoot(id: string, path: string, children: SystemSkillTreeNode[]): SystemSkillTreeNode {
  return {
    id,
    name: "skills",
    path,
    kind: "root",
    skill: null,
    file: null,
    children,
  };
}

function createSkillNode(
  name: string,
  overrides: Partial<Pick<SystemSkill, "gitRepositoryRootPath" | "rootPath" | "source">> = {},
): SystemSkillTreeNode {
  return {
    id: `skill:${name}`,
    name,
    path: overrides.rootPath ?? `C:/tmp/${name}`,
    kind: "skill",
    skill: createSystemSkill(name, overrides),
    file: null,
    children: [],
  };
}

function createSystemSkill(
  name: string,
  overrides: Partial<Pick<SystemSkill, "gitRepositoryRootPath" | "rootPath" | "source">> = {},
): SystemSkill {
  return {
    id: `skill:${name}`,
    slug: name,
    name,
    summary: `${name} summary`,
    manifestPath: `C:/tmp/${name}/SKILL.md`,
    rootPath: overrides.rootPath ?? `C:/tmp/${name}`,
    source: overrides.source ?? "system",
    gitRepositoryRootPath: overrides.gitRepositoryRootPath ?? null,
  };
}
