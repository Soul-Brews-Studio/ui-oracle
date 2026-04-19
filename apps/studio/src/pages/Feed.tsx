import { useEffect } from 'react';

const FEED_ORIGIN = 'https://feed.buildwithoracle.com';

export function Feed() {
  useEffect(() => {
    const qs = typeof window !== 'undefined' ? window.location.search : '';
    window.location.replace(`${FEED_ORIGIN}/${qs}`);
  }, []);
  return (
    <div className="max-w-[1300px] mx-auto py-10 px-6 text-text-secondary">
      <p className="text-sm">Redirecting to <a className="text-accent underline" href={FEED_ORIGIN}>{FEED_ORIGIN}</a>…</p>
    </div>
  );
}
