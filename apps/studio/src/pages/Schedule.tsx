import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, PageShell, hostLabel, useBase } from '@ui-oracle/shared-ui';

const SCHEDULE_ORIGIN = 'https://schedule.buildwithoracle.com';

export function Schedule() {
  const base = useBase();
  // Deliberate raw (non-base-prefixed) navigate: in the combined bundle the
  // schedule app is mounted at the TOP-LEVEL /schedule, not under studio's prefix.
  const navigate = useNavigate();

  useEffect(() => {
    // Combined bundle: jump to the top-level /schedule section (sibling app).
    if (base) {
      navigate('/schedule', { replace: true });
      return;
    }
    // Standalone: hop to the schedule subdomain.
    const currentHost = hostLabel().replace(' (default)', '');
    window.location.replace(`${SCHEDULE_ORIGIN}/?host=${encodeURIComponent(currentHost)}`);
  }, [base, navigate]);

  return (
    <PageShell width="form">
      <EmptyState title="Schedule lives on its own site — opening schedule.buildwithoracle.com…">
        <a className="text-accent underline" href={SCHEDULE_ORIGIN}>Open Schedule now</a>
      </EmptyState>
    </PageShell>
  );
}
