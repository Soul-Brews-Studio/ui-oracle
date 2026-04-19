import { SubNav, isVectorHost, type SubNavItem } from '@ui-oracle/shared-ui';

const DEFAULT_ITEMS: SubNavItem[] = [
  { path: '/', label: 'Vector Playground', icon: '🔍' },
  { path: '/compare', label: 'Compare', icon: '⚖️' },
];

interface Props {
  items?: SubNavItem[];
}

/**
 * Vector-only sub-nav tab strip — rendered only on vector.* hosts. Thin wrapper
 * over the shared SubNav primitive.
 */
export function VectorSubNav({ items = DEFAULT_ITEMS }: Props) {
  return <SubNav items={items} enabled={isVectorHost()} />;
}
