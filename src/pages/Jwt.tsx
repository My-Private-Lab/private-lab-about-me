import { useEffect, useMemo, useState } from 'react';
import { BackLink } from '../components/BackLink';
import { CopyButton } from '../components/CopyButton';
import { usePageMeta } from '../hooks/usePageMeta';
import { useLang, type Lang } from '../i18n';
import type { Messages } from '../i18n/en';
import {
  JwtError,
  REGISTERED_CLAIMS,
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

function dateFormatter(lang: Lang) {
  return new Intl.DateTimeFormat(lang, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

type DecodeResult = { ok: true; jwt: DecodedJwt } | { ok: false; error: unknown } | null;

type JwtText = Messages['jwt'];

function describeError(error: unknown, t: JwtText): string {
  if (!(error instanceof JwtError)) return t.errors.unknown;
  const part = error.detail.part ? t.parts[error.detail.part] : '';
  switch (error.code) {
    case 'empty':
      return t.errors.empty;
    case 'parts':
      return t.errors.parts(error.detail.count ?? 0);
    case 'base64':
      return t.errors.base64(part);
    case 'notObject':
      return t.errors.notObject(part);
    case 'notJson':
      return t.errors.notJson(part);
  }
}

export default function Jwt() {
  const { t } = useLang();
  usePageMeta({ title: t.pageTitle(t.jwt.title) });

  // Deliberately not mirrored into the URL (unlike the cron tool): tokens are
  // credentials and must not end up in history, logs or shared links.
  const [token, setToken] = useState('');

  const result = useMemo<DecodeResult>(() => {
    if (token.trim() === '') return null;
    try {
      return { ok: true, jwt: decodeJwt(token) };
    } catch (error) {
      return { ok: false, error };
    }
  }, [token]);

  return (
    <main className="card card-projects card-tool">
      <h1>
        <BackLink to="/utils" label={t.backToUtils} />
        {t.jwt.title}
      </h1>
      <p className="description">{t.jwt.description}</p>

      <textarea
        className={`tool-input jwt-input${result?.ok === false ? ' tool-invalid' : ''}`}
        value={token}
        onChange={(event) => setToken(event.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        aria-label={t.jwt.inputLabel}
        aria-invalid={result?.ok === false}
        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
        rows={5}
      />

      <div className="tool-chips jwt-actions">
        <button type="button" className="tool-chip" onClick={() => setToken(SAMPLE_TOKEN)}>
          {t.jwt.sampleToken}
        </button>
        {token !== '' && (
          <button type="button" className="tool-chip" onClick={() => setToken('')}>
            {t.clear}
          </button>
        )}
      </div>

      {result?.ok === false && (
        <p className="tool-error" role="alert">
          {describeError(result.error, t.jwt)}
        </p>
      )}

      {result?.ok && <Decoded jwt={result.jwt} token={token.trim()} />}
    </main>
  );
}

function Decoded({ jwt, token }: { jwt: DecodedJwt; token: string }) {
  const { lang, t } = useLang();
  const state = expiryState(jwt.payload);
  const alg = typeof jwt.header.alg === 'string' ? jwt.header.alg : 'unknown';
  const header = JSON.stringify(jwt.header, null, 2);
  const payload = JSON.stringify(jwt.payload, null, 2);

  return (
    <>
      <p className="tool-summary jwt-summary">
        <span className="jwt-badge">{alg}</span>
        <span className={`jwt-badge jwt-state-${state}`}>{t.jwt.expiry[state]}</span>
        {expirySentence(jwt.payload, state, lang, t.jwt)}
      </p>

      <p className="jwt-token" aria-hidden="true">
        <span className="jwt-part-header">{jwt.raw.header}</span>.
        <span className="jwt-part-payload">{jwt.raw.payload}</span>.
        <span className="jwt-part-signature">{jwt.raw.signature}</span>
      </p>

      <SectionHeading part="header" copy={header} />
      <pre className="tool-code">{header}</pre>

      <SectionHeading part="payload" copy={payload} />
      <pre className="tool-code">{payload}</pre>

      <Claims payload={jwt.payload} />

      <SectionHeading part="signature" copy={jwt.raw.signature} />
      <pre className="tool-code jwt-signature">{jwt.raw.signature || t.jwt.empty}</pre>
      <Verify token={token} alg={alg} />
    </>
  );
}

function SectionHeading({ part, copy }: { part: 'header' | 'payload' | 'signature'; copy: string }) {
  const { t } = useLang();
  const title = t.jwt.parts[part];
  return (
    <div className="tool-heading-row">
      <h2 className="tool-heading">
        <span className={`jwt-dot jwt-dot-${part}`} aria-hidden="true" />
        {title}
      </h2>
      <CopyButton text={copy} label={t.jwt.copyPart(title)} className="tool-button-sm" />
    </div>
  );
}

/** One line under the badges: when the token expires / expired / becomes valid. */
function expirySentence(payload: Record<string, unknown>, state: ExpiryState, lang: Lang, t: JwtText): string {
  const exp = formatTimeClaim('exp', payload.exp, lang);
  const nbf = formatTimeClaim('nbf', payload.nbf, lang);
  if (state === 'not-yet-valid' && nbf) return t.becomesValid(nbf.relative);
  if (state === 'expired' && exp) return t.expiredWhen(exp.relative);
  if (state === 'valid' && exp) return t.expires(exp.relative);
  return t.noExp;
}

function Claims({ payload }: { payload: Record<string, unknown> }) {
  const { lang, t } = useLang();
  const formatDate = useMemo(() => dateFormatter(lang), [lang]);
  const claims = REGISTERED_CLAIMS.filter((claim) => claim in payload);
  if (claims.length === 0) return null;

  return (
    <>
      <h2 className="tool-heading">
        {t.jwt.registeredClaims} <span className="tool-heading-aside">{localTimeZone}</span>
      </h2>
      <ul className="tool-rows jwt-claims">
        {claims.map((claim) => {
          const value = payload[claim];
          const time = (TIME_CLAIMS as readonly string[]).includes(claim)
            ? formatTimeClaim(claim as TimeClaim, value, lang)
            : null;
          return (
            <li key={claim}>
              <code>{claim}</code>
              <span className="jwt-claim-label">{t.jwt.claims[claim]}</span>
              <span className="jwt-claim-value">
                {time ? (
                  <>
                    {formatDate.format(time.date)}
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
  const { t } = useLang();
  const [secret, setSecret] = useState('');
  // Remember what was verified so a stale result never shows for a new token or secret.
  const [checked, setChecked] = useState<{ token: string; secret: string; result: VerifyResult }>();
  const [busy, setBusy] = useState(false);

  useEffect(() => setChecked(undefined), [token, secret]);

  if (!isHmacAlg(alg)) {
    return (
      <p className="tool-note">
        {t.jwt.unsupportedAlg.before} <code>{alg}</code> {t.jwt.unsupportedAlg.middle} (
        <code>HS256</code>, <code>HS384</code>, <code>HS512</code>)
        {t.jwt.unsupportedAlg.after}
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
          aria-label={t.jwt.secretLabel}
          placeholder={t.jwt.secretPlaceholder(alg)}
        />
        <button type="submit" className="tool-button" disabled={secret === '' || busy}>
          {t.jwt.verify}
        </button>
      </form>

      {result?.status === 'valid' && <p className="tool-summary">{t.jwt.verified}</p>}
      {result?.status === 'invalid' && (
        <p className="tool-error" role="alert">
          {t.jwt.mismatch}
        </p>
      )}
      {result?.status === 'malformed' && (
        <p className="tool-error" role="alert">
          {t.jwt.malformed}
        </p>
      )}
      {result?.status === 'error' && (
        <p className="tool-error" role="alert">
          {result.message ?? t.jwt.verifyFailed}
        </p>
      )}
    </>
  );
}
