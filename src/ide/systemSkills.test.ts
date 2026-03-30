import { mergeWorkspaceFiles } from "./systemSkills";

test("keeps dirty editor content when refreshed system skill files arrive", () => {
  const mergedFiles = mergeWorkspaceFiles(
    [
      {
        content: "# Explain Code\nDirty draft\n",
        id: "system-skill:1:SKILL.md",
        isWritable: true,
        language: "md",
        path: "system-skills/explain-code/SKILL.md",
        relativePath: "SKILL.md",
        rootPath: "/tmp/explain-code",
        savedContent: "# Explain Code\nOriginal content\n",
      },
    ],
    [
      {
        content: "# Explain Code\nDisk update\n",
        id: "system-skill:1:SKILL.md",
        isWritable: true,
        language: "md",
        path: "system-skills/explain-code/SKILL.md",
        relativePath: "SKILL.md",
        rootPath: "/tmp/explain-code",
        savedContent: "# Explain Code\nDisk update\n",
      },
    ],
  );

  expect(mergedFiles).toHaveLength(1);
  expect(mergedFiles[0]?.content).toBe("# Explain Code\nDirty draft\n");
  expect(mergedFiles[0]?.savedContent).toBe("# Explain Code\nDisk update\n");
});
