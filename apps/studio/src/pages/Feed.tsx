import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBase } from '@ui-oracle/shared-ui';

const FEED_ORIGIN = 'https://feed.buildwithoracle.com';

export function Feed() {
  const base = useBase();
  // Deliberate raw (non-base-prefixed) navigate: in the combined bundle the
  // feed app is mounted at the TOP-LEVEL /feed, not under studio's /studio prefix.
  const navigate = useNavigate();

  useEffect(() => {
    // Combined bundle: jump to the top-level /feed section (sibling app).
    if (base) {
      navigate('/feed', { replace: true });
      return;
    }
    // Standalone: hop to the feed subdomain.
    const qs = typeof window !== 'undefined' ? window.location.search : '';
    window.location.replace(`${FEED_ORIGIN}/${qs}`);
  }, [base, navigate]);

  return (
    <div className="max-w-[1300px] mx-auto py-10 px-6 text-text-secondary">
      <p className="text-sm">Redirecting to <a className="text-accent underline" href={FEED_ORIGIN}>{FEED_ORIGIN}</a>…</p>
    </div>
  );
}
