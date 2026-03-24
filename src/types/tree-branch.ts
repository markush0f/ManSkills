export type TreeBranch = {
  children: Map<string, TreeBranch>;
  fileId?: string;
};
