import { useEffect } from 'react';
import { hostLabel } from '@ui-oracle/shared-ui';

const SCHEDULE_ORIGIN = 'https://schedule.buildwithoracle.com';

export function Schedule() {
  useEffect(() => {
    const currentHost = hostLabel().replace(' (default)', '');
    window.location.replace(`${SCHEDULE_ORIGIN}/?host=${encodeURIComponent(currentHost)}`);
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center text-text-muted text-sm">
      Redirecting to {SCHEDULE_ORIGIN} …
    </div>
  );
}
