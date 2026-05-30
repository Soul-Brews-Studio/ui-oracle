import { createContext, useContext } from 'react';
import { Link, useNavigate, type LinkProps, type NavigateOptions } from 'react-router-dom';

const BaseCtx = createContext<string>('');
export const BasePathProvider = BaseCtx.Provider;
export function useBase(): string { return useContext(BaseCtx); }

/** Prefix a leading-slash in-app path with the active base. Identity when base==='' (standalone). */
export function withBase(base: string, to: string): string {
  if (!base || !to.startsWith('/')) return to;
  return base + to;
}

/** Drop-in for <Link to="/abs">. Relative/hash/external 'to' pass through unchanged. */
export function AppLink({ to, ...rest }: LinkProps) {
  const base = useBase();
  return <Link to={typeof to === 'string' ? withBase(base, to) : to} {...rest} />;
}

/** Drop-in for useNavigate(); base-prefixes string targets, passes numbers through. */
export function useNavTo() {
  const base = useBase();
  const navigate = useNavigate();
  return (to: string | number, opts?: NavigateOptions) =>
    typeof to === 'number' ? navigate(to) : navigate(withBase(base, to), opts);
}
