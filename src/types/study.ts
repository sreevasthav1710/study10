export interface TreeNode {
  id: string;
  name: string;
  completed: boolean;
  children: TreeNode[];
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  chapters: TreeNode[];
}

export type UserRole = "admin" | "student";

export interface User {
  username: string;
  role: UserRole;
}
