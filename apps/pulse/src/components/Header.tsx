import { AppHeader } from '@ui-oracle/shared-ui';
import { ping } from '../api/pulse';

export function Header() {
  return <AppHeader brandLabel="ARRA 🔮Racle — Pulse 🫀" ping={ping} />;
}
