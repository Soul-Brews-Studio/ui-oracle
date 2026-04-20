import { AppHeader } from '@ui-oracle/shared-ui';
import { ping } from '../api/oracle';
import menuConfig from '../../menu.json';

export function Header() {
  return <AppHeader brandLabel="ARRA 🔮Racle — Forum" ping={ping} menuConfig={menuConfig} />;
}
