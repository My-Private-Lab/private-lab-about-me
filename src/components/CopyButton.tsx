import { useEffect, useState } from 'react';
import { useLang } from '../i18n';
import { CheckIcon, CopyIcon } from '../icons';

interface CopyButtonProps {
  text: string;
  /** Accessible name, e.g. "Copy expression". */
  label: string;
  className?: string;
}

/** "Copy" button for the tools — flips to "Copied" until the text changes. */
export function CopyButton({ text, label, className = '' }: CopyButtonProps) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);

  useEffect(() => setCopied(false), [text]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className={`tool-button ${className}`.trim()}
      onClick={copy}
      aria-label={label}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? t.copied : t.copy}
    </button>
  );
}
