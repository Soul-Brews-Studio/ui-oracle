import { AppHeader, isVectorHost as sharedIsVectorHost } from '@ui-oracle/shared-ui';
import { ping } from '../api/oracle';
import menuConfig from '../../menu.json';

/**
 * Vector bundle header — thin wrapper over the shared AppHeader.
 * App-specific wiring: passes the local `ping` fn for the backend chip.
 */
export function Header() {
  return <AppHeader brandLabel="ARRA Oracle 🔮 — Vector" ping={ping} menuConfig={menuConfig} />;
}

/** Re-exported for existing imports (VectorSubNav etc.). */
export const isVectorHost = sharedIsVectorHost;
