import { AppHeader } from '@ui-oracle/shared-ui';
import { ping } from '../api/oracle';

export function Header() {
  return <AppHeader brandLabel="ARRA 🔮Racle — Feed" ping={ping} />;
}
