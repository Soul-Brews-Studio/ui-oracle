import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const STUDIO_ORIGIN = 'https://studio.buildwithoracle.com';

export function DocRedirect() {
  const { id } = useParams<{ id: string }>();
  useEffect(() => {
    if (id) {
      window.location.replace(`${STUDIO_ORIGIN}/doc/${id}`);
    }
  }, [id]);
  return (
    <div className="max-w-[1300px] mx-auto py-10 px-6 text-text-secondary">
      <p className="text-sm">Redirecting to <a className="text-accent underline" href={STUDIO_ORIGIN}>studio</a>…</p>
    </div>
  );
}
