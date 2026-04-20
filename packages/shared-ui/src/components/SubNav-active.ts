/**
 * Active if pathname matches AND every query param declared on the item is
 * present with the same value on the current URL. Item paths without a query
 * string fall back to pathname-only comparison.
 */
export function isSubNavItemActive(
  itemPath: string,
  currentPath: string,
  currentSearch: string,
): boolean {
  const [cleanPath, queryStr] = itemPath.split('?');
  if (currentPath !== cleanPath) return false;
  if (!queryStr) return true;
  const itemParams = new URLSearchParams(queryStr);
  const currentParams = new URLSearchParams(currentSearch);
  for (const [k, v] of itemParams.entries()) {
    if (currentParams.get(k) !== v) return false;
  }
  return true;
}
