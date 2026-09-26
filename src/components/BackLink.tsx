import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '../icons';

interface BackLinkProps {
  to: string;
  /** Accessible name — the link itself shows only an arrow. */
  label: string;
}

/** Back arrow rendered inline at the start of a page heading. */
export function BackLink({ to, label }: BackLinkProps) {
  return (
    <Link to={to} className="back-link" aria-label={label}>
      <ChevronLeftIcon />
    </Link>
  );
}
