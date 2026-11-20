type CategoryID = number;

export interface CategoryTreeNode {
  id: CategoryID;
  parent?: CategoryID | { id: CategoryID } | null;
  status: 'draft' | 'published';
}

export function categoryParentID(category: CategoryTreeNode): CategoryID | undefined {
  return typeof category.parent === 'object' ? category.parent?.id : category.parent ?? undefined;
}

export function categoryAncestors<T extends CategoryTreeNode>(category: CategoryTreeNode, categories: T[]): T[] {
  const nodes = new Map(categories.map(node => [node.id, node]));
  const seen = new Set([category.id]);
  const ancestors: T[] = [];
  let parentId = categoryParentID(category);
  while (parentId !== undefined) {
    if (seen.has(parentId)) return [];
    const parent = nodes.get(parentId);
    if (parent?.status !== 'published') break;
    seen.add(parent.id);
    ancestors.push(parent);
    parentId = categoryParentID(parent);
  }
  return ancestors.reverse();
}

function publicTree<T extends CategoryTreeNode>(categories: T[]) {
  const nodes = new Map(categories.filter(category => category.status === 'published').map(category => [category.id, category]));
  const children = new Map<CategoryID, T[]>();
  for (const category of nodes.values()) {
    const parent = categoryParentID(category);
    if (parent !== undefined) {
      const siblings = children.get(parent) ?? [];
      siblings.push(category);
      children.set(parent, siblings);
    }
  }
  return { nodes, children };
}

/** Traverse only published edges. A visited set also makes legacy cyclic data terminate. */
export function categorySubtreeIDs(rootID: CategoryID, categories: CategoryTreeNode[]): CategoryID[] {
  const { nodes, children } = publicTree(categories);
  if (!nodes.has(rootID)) return [];
  const visited = new Set<CategoryID>();
  const pending = [rootID];
  while (pending.length) {
    const id = pending.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const child of children.get(id) ?? []) pending.push(child.id);
  }
  return [...visited];
}

/** Pre-order options preserve the supplied display order, including safe fallbacks for orphan/cyclic data. */
export function categoryTreeOptions<T extends CategoryTreeNode>(categories: T[]): { category: T; depth: number }[] {
  const { nodes, children } = publicTree(categories);
  const options: { category: T; depth: number }[] = [];
  const visited = new Set<CategoryID>();
  const appendBranch = (root: T) => {
    const pending = [{ category: root, depth: 0 }];
    while (pending.length) {
      const next = pending.pop()!;
      if (visited.has(next.category.id)) continue;
      visited.add(next.category.id);
      options.push(next);
      const descendants = children.get(next.category.id) ?? [];
      for (let index = descendants.length - 1; index >= 0; index--) {
        pending.push({ category: descendants[index], depth: next.depth + 1 });
      }
    }
  };
  for (const category of nodes.values()) {
    const parent = categoryParentID(category);
    if (parent === undefined || !nodes.has(parent)) appendBranch(category);
  }
  for (const category of nodes.values()) if (!visited.has(category.id)) appendBranch(category);
  return options;
}
