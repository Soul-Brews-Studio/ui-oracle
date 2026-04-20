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

// Tokens
export { LAYOUT, CHIP_COLORS } from './tokens';

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
  setStoredHost,
  wsUrl,
} from './host';

// Client cache
export { cached, cacheBus, localStore, idbStore } from './cache';
export type { CacheEntry, CachePolicy, InvalidationEvent, CacheStore } from './cache';
