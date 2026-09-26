import { useEffect, useMemo, useState } from 'react';
import { BackLink } from '../components/BackLink';
import { CopyButton } from '../components/CopyButton';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  CLAIM_LABELS,
  JwtError,
  TIME_CLAIMS,
  decodeJwt,
  expiryState,
  formatTimeClaim,
  isHmacAlg,
  verifyHmac,
  type DecodedJwt,
  type ExpiryState,
  type TimeClaim,
  type VerifyResult,
} from '../lib/jwt';

const SAMPLE_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.' +
  'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const EXPIRY_LABEL: Record<ExpiryState, string> = {
  valid: 'Not expired',
  expired: 'Expired',
  'not-yet-valid': 'Not yet valid',
  unknown: 'No expiry',
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

type DecodeResult = { ok: true; jwt: DecodedJwt } | { ok: false; error: string } | null;

export default function Jwt() {
  usePageMeta({ title: 'JWT Decoder — Igor Savin' });

  // Deliberately not mirrored into the URL (unlike the cron tool): tokens are
  // credentials and must not end up in history, logs or shared links.
  const [token, setToken] = useState('');

  const result = useMemo<DecodeResult>(() => {
    if (token.trim() === '') return null;
    try {
      return { ok: true, jwt: decodeJwt(token) };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof JwtError ? error.message : 'Failed to decode the token',
      };
    }
  }, [token]);

  return (
    <main className="card card-projects card-tool">
      <h1>
        <BackLink to="/utils" label="Back to Utils" />
        JWT Decoder
      </h1>
      <p className="description">
        Paste a JSON Web Token to see its header, payload and claims, and verify an HMAC
        signature. Everything happens in your browser — nothing is sent anywhere.
      </p>

      <textarea
        className={`tool-input jwt-input${result?.ok === false ? ' tool-invalid' : ''}`}
        value={token}
        onChange={(event) => setToken(event.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        aria-label="Encoded token"
        aria-invalid={result?.ok === false}
        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
        rows={5}
      />

      <div className="tool-chips jwt-actions">
        <button type="button" className="tool-chip" onClick={() => setToken(SAMPLE_TOKEN)}>
          Sample token
        </button>
        {token !== '' && (
          <button type="button" className="tool-chip" onClick={() => setToken('')}>
            Clear
          </button>
        )}
      </div>

      {result?.ok === false && (
        <p className="tool-error" role="alert">
          {result.error}
        </p>
      )}

      {result?.ok && <Decoded jwt={result.jwt} token={token.trim()} />}
    </main>
  );
}

function Decoded({ jwt, token }: { jwt: DecodedJwt; token: string }) {
  const state = expiryState(jwt.payload);
  const alg = typeof jwt.header.alg === 'string' ? jwt.header.alg : 'unknown';
  const header = JSON.stringify(jwt.header, null, 2);
  const payload = JSON.stringify(jwt.payload, null, 2);

  return (
    <>
      <p className="tool-summary jwt-summary">
        <span className="jwt-badge">{alg}</span>
        <span className={`jwt-badge jwt-state-${state}`}>{EXPIRY_LABEL[state]}</span>
        {expirySentence(jwt.payload, state)}
      </p>

      <p className="jwt-token" aria-hidden="true">
        <span className="jwt-part-header">{jwt.raw.header}</span>.
        <span className="jwt-part-payload">{jwt.raw.payload}</span>.
        <span className="jwt-part-signature">{jwt.raw.signature}</span>
      </p>

      <SectionHeading title="Header" part="header" copy={header} />
      <pre className="tool-code">{header}</pre>

      <SectionHeading title="Payload" part="payload" copy={payload} />
      <pre className="tool-code">{payload}</pre>

      <Claims payload={jwt.payload} />

      <SectionHeading title="Signature" part="signature" copy={jwt.raw.signature} />
      <pre className="tool-code jwt-signature">{jwt.raw.signature || '(empty)'}</pre>
      <Verify token={token} alg={alg} />
    </>
  );
}

function SectionHeading({
  title,
  part,
  copy,
}: {
  title: string;
  part: 'header' | 'payload' | 'signature';
  copy: string;
}) {
  return (
    <div className="tool-heading-row">
      <h2 className="tool-heading">
        <span className={`jwt-dot jwt-dot-${part}`} aria-hidden="true" />
        {title}
      </h2>
      <CopyButton text={copy} label={`Copy ${title.toLowerCase()}`} className="tool-button-sm" />
    </div>
  );
}

/** One line under the badges: when the token expires / expired / becomes valid. */
function expirySentence(payload: Record<string, unknown>, state: ExpiryState): string {
  const exp = formatTimeClaim('exp', payload.exp);
  const nbf = formatTimeClaim('nbf', payload.nbf);
  if (state === 'not-yet-valid' && nbf) return `Becomes valid ${nbf.relative}`;
  if (state === 'expired' && exp) return `Expired ${exp.relative}`;
  if (state === 'valid' && exp) return `Expires ${exp.relative}`;
  return 'The token has no exp claim';
}

function Claims({ payload }: { payload: Record<string, unknown> }) {
  const claims = Object.keys(CLAIM_LABELS).filter((claim) => claim in payload);
  if (claims.length === 0) return null;

  return (
    <>
      <h2 className="tool-heading">
        Registered claims <span className="tool-heading-aside">{localTimeZone}</span>
      </h2>
      <ul className="tool-rows jwt-claims">
        {claims.map((claim) => {
          const value = payload[claim];
          const time = (TIME_CLAIMS as readonly string[]).includes(claim)
            ? formatTimeClaim(claim as TimeClaim, value)
            : null;
          return (
            <li key={claim}>
              <code>{claim}</code>
              <span className="jwt-claim-label">{CLAIM_LABELS[claim]}</span>
              <span className="jwt-claim-value">
                {time ? (
                  <>
                    {dateFormatter.format(time.date)}
                    <span className="jwt-claim-relative">{time.relative}</span>
                  </>
                ) : typeof value === 'string' ? (
                  value
                ) : (
                  JSON.stringify(value)
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Verify({ token, alg }: { token: string; alg: string }) {
  const [secret, setSecret] = useState('');
  // Remember what was verified so a stale result never shows for a new token or secret.
  const [checked, setChecked] = useState<{ token: string; secret: string; result: VerifyResult }>();
  const [busy, setBusy] = useState(false);

  useEffect(() => setChecked(undefined), [token, secret]);

  if (!isHmacAlg(alg)) {
    return (
      <p className="tool-note">
        Verifying <code>{alg}</code> needs a public key and isn’t supported yet — only HMAC
        signatures (<code>HS256</code>, <code>HS384</code>, <code>HS512</code>) can be checked
        here.
      </p>
    );
  }

  async function verify() {
    setBusy(true);
    const result = await verifyHmac(token, secret, alg);
    setChecked({ token, secret, result });
    setBusy(false);
  }

  const result = checked?.token === token && checked.secret === secret ? checked.result : null;

  return (
    <>
      <form
        className="tool-input-row jwt-verify"
        onSubmit={(event) => {
          event.preventDefault();
          if (secret !== '' && !busy) void verify();
        }}
      >
        <input
          className="tool-input"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          enterKeyHint="go"
          aria-label="HMAC secret"
          placeholder={`${alg} secret`}
        />
        <button type="submit" className="tool-button" disabled={secret === '' || busy}>
          Verify
        </button>
      </form>

      {result?.status === 'valid' && <p className="tool-summary">Signature verified ✓</p>}
      {result?.status === 'invalid' && (
        <p className="tool-error" role="alert">
          Signature doesn’t match this secret
        </p>
      )}
      {result?.status === 'error' && (
        <p className="tool-error" role="alert">
          {result.message}
        </p>
      )}
    </>
  );
}
