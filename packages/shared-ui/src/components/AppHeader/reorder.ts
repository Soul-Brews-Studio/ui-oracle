import type { NavItem, NavSet } from './nav-types';

export interface MenuConfig {
  mainOrder?: string[];
  toolsOrder?: string[];
}

/**
 * Pure helper: reorder NavSet by label. Labels in config come first (in the
 * order given), items not mentioned keep their original relative order after.
 * Case-sensitive match on item.label. Unknown labels in config are ignored.
 */
export function reorderNavSet(navSet: NavSet, config?: MenuConfig): NavSet {
  return {
    main: reorderByLabel(navSet.main, config?.mainOrder),
    tools: reorderByLabel(navSet.tools, config?.toolsOrder),
  };
}

function reorderByLabel(items: NavItem[], order?: string[]): NavItem[] {
  if (!order || order.length === 0) return items;
  const byLabel = new Map(items.map((i) => [i.label, i]));
  const declared: NavItem[] = [];
  const seen = new Set<string>();
  for (const label of order) {
    const item = byLabel.get(label);
    if (item && !seen.has(label)) {
      declared.push(item);
      seen.add(label);
    }
  }
  const rest = items.filter((i) => !seen.has(i.label));
  return [...declared, ...rest];
}
