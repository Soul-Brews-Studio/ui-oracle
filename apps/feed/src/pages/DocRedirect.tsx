import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBase } from '@ui-oracle/shared-ui';

const STUDIO_ORIGIN = 'https://studio.buildwithoracle.com';

export function DocRedirect() {
  const { id } = useParams<{ id: string }>();
  const base = useBase();
  // Raw navigate (NOT base-aware): the doc viewer (studio) is mounted at the
  // combined-bundle ROOT, so the in-app target is the top-level /doc/:id — not
  // base-prefixed (would double to /feed/doc) and not /studio/* (studio is root).
  const navigate = useNavigate();
  useEffect(() => {
    if (!id) return;
    if (base) {
      // Combined bundle: studio's doc viewer lives at the root.
      navigate(`/doc/${id}`, { replace: true });
    } else {
      // Standalone feed: hard-redirect to the studio subdomain.
      window.location.replace(`${STUDIO_ORIGIN}/doc/${id}`);
    }
  }, [id, base, navigate]);
  return (
    <div className="max-w-[1300px] mx-auto py-10 px-6 text-text-secondary">
      <p className="text-sm">Opening document…</p>
    </div>
  );
}
