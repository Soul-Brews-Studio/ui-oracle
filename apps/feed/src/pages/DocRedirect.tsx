import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBase, withBase, useNavTo } from '@ui-oracle/shared-ui';

const STUDIO_ORIGIN = 'https://studio.buildwithoracle.com';

export function DocRedirect() {
  const { id } = useParams<{ id: string }>();
  const base = useBase();
  const navigate = useNavTo();
  useEffect(() => {
    if (id) {
      if (base) {
        // Combined mode: studio is mounted in the same bundle — navigate in-app.
        navigate(withBase(base, `/studio/doc/${id}`), { replace: true });
      } else {
        // Standalone: hard-redirect to the studio subdomain.
        window.location.replace(`${STUDIO_ORIGIN}/doc/${id}`);
      }
    }
  }, [id, base, navigate]);
  return (
    <div className="max-w-[1300px] mx-auto py-10 px-6 text-text-secondary">
      <p className="text-sm">Redirecting to <a className="text-accent underline" href={STUDIO_ORIGIN}>studio</a>…</p>
    </div>
  );
}
