import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BackLink } from '../components/BackLink';
import { CopyButton } from '../components/CopyButton';
import { usePageMeta } from '../hooks/usePageMeta';
import { SaveIcon, TrashIcon } from '../icons';
import {
  DEFAULT_COUNTER_BITS,
  DEFAULT_NODE_ID_BITS,
  MAX_FIELD_BITS,
  MAX_ID_DIGITS,
  decodeSnowflake,
  isValidLayout,
  maxValue,
  parseId,
  timestampBits,
  timestampRange,
  type SnowflakeLayout,
} from '../lib/snowflake';

const SAMPLE_ID = '4038663563538082816';
const MAX_HISTORY = 5;

const LAYOUT_KEY = 'snowflake-decoder-bits';
const HISTORY_KEY = 'snowflake-decoder-history';

interface HistoryItem {
  id: string;
  snowflakeId: string;
  timestamp: string;
  nodeId: string;
  counter: string;
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — the tool still works */
  }
}

function loadLayout(): SnowflakeLayout {
  const stored = readJson(LAYOUT_KEY) as Partial<SnowflakeLayout> | null;
  const layout = { nodeIdBits: Number(stored?.nodeIdBits), counterBits: Number(stored?.counterBits) };
  const inRange = (bits: number) => Number.isInteger(bits) && bits >= 1 && bits <= MAX_FIELD_BITS;
  return inRange(layout.nodeIdBits) && inRange(layout.counterBits) && isValidLayout(layout)
    ? layout
    : { nodeIdBits: DEFAULT_NODE_ID_BITS, counterBits: DEFAULT_COUNTER_BITS };
}

function loadHistory(): HistoryItem[] {
  const stored = readJson(HISTORY_KEY);
  if (!Array.isArray(stored)) return [];
  // Older entries (from the standalone app) kept numbers; normalise to strings.
  return stored
    .filter((item) => item && typeof item.id === 'string' && typeof item.snowflakeId === 'string')
    .map((item) => ({
      id: item.id,
      snowflakeId: item.snowflakeId,
      timestamp: String(item.timestamp),
      nodeId: String(item.nodeId),
      counter: String(item.counter),
    }));
}

export default function Snowflake() {
  usePageMeta({ title: 'Snowflake ID Decoder — Igor Savin' });

  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(() => searchParams.get('id') ?? SAMPLE_ID);
  const [layout, setLayout] = useState(loadLayout);
  const [history, setHistory] = useState(loadHistory);

  useEffect(() => writeJson(LAYOUT_KEY, layout), [layout]);
  useEffect(() => writeJson(HISTORY_KEY, history), [history]);

  const id = useMemo(() => parseId(input), [input]);
  const invalid = input.trim() !== '' && id === null;
  const decoded = id !== null ? decodeSnowflake(id, layout) : null;

  function update(next: string) {
    // Digits only: paste of "4038 6635…" or "id=…" still works.
    const digits = next.replace(/\D/g, '').slice(0, MAX_ID_DIGITS);
    setInput(digits);
    setSearchParams(digits === '' ? {} : { id: digits }, { replace: true });
  }

  function save() {
    if (!decoded) return;
    const entry: HistoryItem = {
      id: crypto.randomUUID(),
      snowflakeId: input.trim(),
      timestamp: decoded.timestamp.toString(),
      nodeId: decoded.nodeId.toString(),
      counter: decoded.counter.toString(),
    };
    setHistory((prev) =>
      [entry, ...prev.filter((item) => item.snowflakeId !== entry.snowflakeId)].slice(0, MAX_HISTORY),
    );
  }

  // The steppers never let node + counter eat into the sign bit (see Part).
  const tsBits = timestampBits(layout);
  const shift = layout.nodeIdBits + layout.counterBits;
  const formula = `((timestamp << ${shift}) | (nodeId << ${layout.counterBits}) | counter) & Long.MAX_VALUE`;

  return (
    <main className="card card-projects card-tool">
      <h1>
        <BackLink to="/utils" label="Back to Utils" />
        Snowflake ID Decoder
      </h1>
      <p className="description">
        Split a Snowflake ID into its timestamp, node and counter. Adjust the bit layout to
        match your generator. Everything happens in your browser.
      </p>

      <form
        className="tool-input-row"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <input
          className={`tool-input sf-input${invalid ? ' tool-invalid' : ''}`}
          value={input}
          onChange={(event) => update(event.target.value)}
          inputMode="numeric"
          enterKeyHint="done"
          spellCheck={false}
          autoComplete="off"
          aria-label="Snowflake ID"
          aria-invalid={invalid}
          placeholder="Snowflake ID, e.g. 4038663563538082816"
        />
        <button type="submit" className="tool-button" disabled={!decoded} aria-label="Save to history">
          <SaveIcon />
          <span className="sf-button-text">Save</span>
        </button>
      </form>

      <div className="tool-chips sf-actions">
        <button type="button" className="tool-chip" onClick={() => update(SAMPLE_ID)}>
          Sample ID
        </button>
        {input !== '' && (
          <button type="button" className="tool-chip" onClick={() => update('')}>
            Clear
          </button>
        )}
      </div>

      {invalid && (
        <p className="tool-error" role="alert">
          Not a valid ID — enter a whole number up to 9223372036854775807 (Long.MAX_VALUE).
        </p>
      )}

      {decoded && (
        <>
          <p className="sf-binary" aria-hidden="true">
            <span className="sf-part-sign">0</span>
            <span className="sf-part-timestamp">{binary(decoded.timestamp, tsBits)}</span>
            <span className="sf-part-node">{binary(decoded.nodeId, layout.nodeIdBits)}</span>
            <span className="sf-part-counter">{binary(decoded.counter, layout.counterBits)}</span>
          </p>

          <h2 className="tool-heading">Components</h2>
          <ul className="tool-rows sf-parts">
            <Part
              part="timestamp"
              value={decoded.timestamp}
              bits={tsBits}
              hint={`seconds · wraps after ${timestampRange(tsBits)}`}
            />
            <Part
              part="node"
              label="nodeId"
              value={decoded.nodeId}
              bits={layout.nodeIdBits}
              hint={`0–${maxValue(layout.nodeIdBits).toLocaleString('en-US')}`}
              canGrow={tsBits > 0}
              onBits={(nodeIdBits) => setLayout((prev) => ({ ...prev, nodeIdBits }))}
            />
            <Part
              part="counter"
              value={decoded.counter}
              bits={layout.counterBits}
              hint={`0–${maxValue(layout.counterBits).toLocaleString('en-US')} per second`}
              canGrow={tsBits > 0}
              onBits={(counterBits) => setLayout((prev) => ({ ...prev, counterBits }))}
            />
          </ul>
          <p className="tool-note sf-layout-note">
            64 bits in total: the sign bit is always <code>0</code>, the timestamp gets what the
            node and counter leave.
          </p>

          <div className="tool-heading-row">
            <h2 className="tool-heading">Generation formula</h2>
            <CopyButton text={formula} label="Copy formula" className="tool-button-sm" />
          </div>
          <pre className="tool-code">{formula}</pre>
        </>
      )}

      {history.length > 0 && (
        <>
          <div className="tool-heading-row">
            <h2 className="tool-heading">
              History <span className="tool-heading-aside">last {MAX_HISTORY}</span>
            </h2>
            <button type="button" className="tool-button tool-button-sm" onClick={() => setHistory([])}>
              <TrashIcon />
              Clear all
            </button>
          </div>
          <ul className="tool-rows sf-history">
            {history.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="sf-history-id"
                  onClick={() => update(item.snowflakeId)}
                  aria-label={`Decode ${item.snowflakeId}`}
                >
                  <code>{item.snowflakeId}</code>
                  <span className="sf-history-meta">
                    <span className="sf-part-timestamp">{item.timestamp}</span> ·{' '}
                    <span className="sf-part-node">{item.nodeId}</span> ·{' '}
                    <span className="sf-part-counter">{item.counter}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="sf-icon-button"
                  onClick={() => setHistory((prev) => prev.filter((other) => other.id !== item.id))}
                  aria-label={`Remove ${item.snowflakeId} from history`}
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

function binary(value: bigint, bits: number): string {
  return bits > 0 ? value.toString(2).padStart(bits, '0') : '';
}

function Part({
  part,
  label = part,
  value,
  bits,
  hint,
  canGrow = false,
  onBits,
}: {
  part: 'timestamp' | 'node' | 'counter';
  label?: string;
  value: bigint;
  bits: number;
  hint: string;
  /** False once the timestamp is down to 0 bits — node + counter can't grow further. */
  canGrow?: boolean;
  onBits?: (bits: number) => void;
}) {
  return (
    <li>
      <code className={`sf-part-label sf-part-${part}`}>{label}</code>
      <span className="sf-part-value">
        {value.toString()}
        <span className="sf-part-hint">{hint}</span>
      </span>
      <span className="sf-bits">
        {onBits && (
          <button
            type="button"
            className="sf-step"
            onClick={() => onBits(Math.max(1, bits - 1))}
            disabled={bits <= 1}
            aria-label={`Fewer ${label} bits`}
          >
            −
          </button>
        )}
        <span className="sf-bits-value">
          {bits} bit{bits === 1 ? '' : 's'}
        </span>
        {onBits && (
          <button
            type="button"
            className="sf-step"
            onClick={() => onBits(bits + 1)}
            disabled={!canGrow}
            aria-label={`More ${label} bits`}
          >
            +
          </button>
        )}
      </span>
    </li>
  );
}
