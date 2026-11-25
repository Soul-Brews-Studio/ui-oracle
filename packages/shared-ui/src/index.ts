// Barrel — the canonical entry point for `@ui-oracle/shared-ui`.

// Header primitives + composer
export {
  AppHeader,
  defaultCrossOriginHref,
  isVectorPath,
  Brand,
  VersionChip,
  BackendChip,
  HostPicker,
  MainNav,
  ToolsDropdown,
  useMenu,
  useBackendVersion,
  buildNavSet,
  isActivePath,
  reorderNavSet,
} from './components/AppHeader';
export type {
  BackendStatus,
  NavItem,
  NavSet,
  MenuApiItem,
  CrossOriginResolver,
  MenuConfig,
} from './components/AppHeader';

// Layout primitives
export { SubNav } from './components/SubNav';
export type { SubNavItem } from './components/SubNav';
export { PageShell } from './components/PageShell';
export { PageHeader } from './components/PageHeader';
export { PillRow, pillClass } from './components/Pills';
export { EmptyState } from './components/EmptyState';
export { SectionLinks, SectionTabs } from './components/SectionNav';
export { SECTIONS, sectionFor, tabMatches } from './sections';
export { getSpace, setSpace, onSpaceChange, spaceParam } from './space';
export type { Section, SectionTab } from './sections';
export { BuildFooter } from './components/BuildFooter';

// Base-path routing (combined single-origin bundle; identity when standalone)
export { BasePathProvider, useBase, withBase, AppLink, useNavTo } from './base-path';

// Tokens
export { LAYOUT, CHIP_COLORS } from './tokens';
export type { PageWidth } from './tokens';

// Host resolution
export {
  activeHost,
  apiUrl,
  clearStoredHost,
  getRecentHosts,
  getStoredHost,
  hostLabel,
  isCanvasHost,
  isDefault,
  isRemote,
  isStudioHost,
  isVectorHost,
  isManuallyDisconnected,
  setManuallyDisconnected,
  setStoredHost,
  wsUrl,
} from './host';

// Client cache
export { cached, cacheBus, localStore, idbStore } from './cache';
export type { CacheEntry, CachePolicy, InvalidationEvent, CacheStore } from './cache';
