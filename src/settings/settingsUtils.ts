import type { SystemSkillTreeNode } from "../ide/types";

export function countSkills(nodes: SystemSkillTreeNode[]): number {
  return nodes.reduce((total, node) => {
    const current = node.kind === "skill" ? 1 : 0;
    return total + current + countSkills(node.children);
  }, 0);
}

export function matchesSearch(query: string, ...values: string[]) {
  if (query.length === 0) {
    return true;
  }

  const normalizedQuery = query.trim().toLowerCase();
  return values.some((value) => value.toLowerCase().includes(normalizedQuery));
}
