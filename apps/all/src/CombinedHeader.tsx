import { AppHeader, apiUrl } from '@ui-oracle/shared-ui';
import { inAppHref } from './nav-map';

/** Backend reachability probe for the live/demo chip. */
async function ping(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/api/stats'), { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * One unified top nav for the combined bundle. Runs the shared AppHeader in
 * combinedMode so every nav item routes same-origin via inAppHref (→ /studio,
 * /vector, …) instead of bouncing across subdomains.
 */
export function CombinedHeader() {
  return <AppHeader ping={ping} combinedMode inAppHref={inAppHref} />;
}
