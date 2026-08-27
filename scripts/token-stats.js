#!/usr/bin/env node
// token-stats.js — parse the active Claude Code session JSONL and report
// token usage + estimated cost for the current session.
//
// Usage:
//   node scripts/token-stats.js                         # auto-find latest session
//   node scripts/token-stats.js --session-file <path>   # explicit session file
//   node scripts/token-stats.js --all                   # aggregate all logged sessions
//   node scripts/token-stats.js --since 7d              # last N days/hours
//
// Adapted from caveman (github.com/JuliusBrussee/caveman) — generalized for
// any Claude Code project (no caveman-specific compression estimates).

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

// Anthropic public output-token pricing, USD per million tokens.
// Source: https://www.anthropic.com/pricing — update when tiers change.
const MODEL_PRICES = [
  ['claude-opus-4',     75.00],
  ['claude-sonnet-4',   15.00],
  ['claude-haiku-4',     4.00],
  ['claude-3-5-sonnet', 15.00],
  ['claude-3-5-haiku',   4.00],
  ['claude-3-opus',     75.00],
];

function priceFor(model) {
  if (!model) return null;
  for (const [prefix, price] of MODEL_PRICES) {
    if (model.startsWith(prefix)) return price;
  }
  return null;
}

function fmtUsd(n) {
  if (n >= 1)    return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(4)}`;
}

function fmtTokens(n) {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return String(Math.round(n));
}

// Walk ~/.claude/projects/ and return the most recently modified .jsonl file.
function findLatestSession(claudeDir) {
  const projectsDir = path.join(claudeDir, 'projects');
  let best = null;
  const stack = [];
  try {
    for (const e of fs.readdirSync(projectsDir, { withFileTypes: true })) {
      stack.push(path.join(projectsDir, e.name));
    }
  } catch { return null; }

  while (stack.length) {
    const p = stack.pop();
    let st;
    try { st = fs.statSync(p); } catch { continue; }
    if (st.isDirectory()) {
      try {
        for (const child of fs.readdirSync(p)) stack.push(path.join(p, child));
      } catch {}
    } else if (p.endsWith('.jsonl') && (!best || st.mtimeMs > best.mtime)) {
      best = { file: p, mtime: st.mtimeMs };
    }
  }
  return best ? best.file : null;
}

// Parse a Claude Code session JSONL file and sum token usage from assistant turns.
function parseSession(filePath) {
  let raw;
  try { raw = fs.readFileSync(filePath, 'utf8'); }
  catch { return { inputTokens: 0, outputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0, turns: 0, model: null }; }

  let inputTokens = 0, outputTokens = 0, cacheWriteTokens = 0, cacheReadTokens = 0;
  let turns = 0;
  let model = null;

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    if (entry.type !== 'assistant' || !entry.message) continue;
    const u = entry.message.usage;
    if (!u) continue;
    inputTokens      += u.input_tokens                || 0;
    outputTokens     += u.output_tokens               || 0;
    cacheWriteTokens += u.cache_creation_input_tokens || 0;
    cacheReadTokens  += u.cache_read_input_tokens     || 0;
    turns++;
    if (!model && entry.message.model) model = entry.message.model;
  }
  return { inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens, turns, model };
}

// Append a snapshot line to the history log (symlink-safe via O_APPEND).
function appendHistory(historyPath, line) {
  try {
    fs.mkdirSync(path.dirname(historyPath), { recursive: true });
    const st = fs.lstatSync(historyPath).isSymbolicLink();
    if (st) return; // refuse symlink target
  } catch (e) {
    if (e.code !== 'ENOENT') return;
  }
  try {
    const O_NOFOLLOW = typeof fs.constants.O_NOFOLLOW === 'number' ? fs.constants.O_NOFOLLOW : 0;
    const fd = fs.openSync(historyPath,
      fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND | O_NOFOLLOW, 0o600);
    fs.writeSync(fd, line.replace(/\n$/, '') + '\n');
    fs.closeSync(fd);
  } catch {}
}

function readHistory(historyPath) {
  try {
    const st = fs.lstatSync(historyPath);
    if (st.isSymbolicLink() || !st.isFile()) return [];
    return fs.readFileSync(historyPath, 'utf8').split('\n').filter(l => l.trim());
  } catch { return []; }
}

// Aggregate latest-per-session snapshots from the history log.
function aggregateHistory(historyPath, sinceMs) {
  const lines = readHistory(historyPath);
  const cutoff = sinceMs ? Date.now() - sinceMs : null;
  const latest = new Map();
  for (const line of lines) {
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    if (!e || typeof e !== 'object') continue;
    if (cutoff !== null && (e.ts || 0) < cutoff) continue;
    const id = e.session_id || '_';
    const prev = latest.get(id);
    if (!prev || (e.ts || 0) >= (prev.ts || 0)) latest.set(id, e);
  }
  let inputTokens = 0, outputTokens = 0, cacheReadTokens = 0, costUsd = 0;
  for (const e of latest.values()) {
    inputTokens    += e.input_tokens      || 0;
    outputTokens   += e.output_tokens     || 0;
    cacheReadTokens += e.cache_read_tokens || 0;
    costUsd        += e.cost_usd          || 0;
  }
  return { sessions: latest.size, inputTokens, outputTokens, cacheReadTokens, costUsd };
}

function parseDuration(spec) {
  if (!spec) return null;
  const m = /^(\d+)([dh])$/.exec(spec.trim());
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return m[2] === 'd' ? n * 86_400_000 : n * 3_600_000;
}

const SEP = '──────────────────────────────────';

function formatSession({ inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens, turns, model, sessionPath }) {
  if (turns === 0) {
    return `\nToken Stats\n${SEP}\nNo turns yet — stats available after first response.\n${SEP}\n`;
  }
  const price = priceFor(model);
  const shortPath = sessionPath && sessionPath.length > 50
    ? '...' + sessionPath.slice(-50) : (sessionPath || '');

  let costLine = '';
  let costUsd = 0;
  if (price !== null) {
    costUsd = (outputTokens / 1_000_000) * price;
    costLine = `Est. output cost:      ${fmtUsd(costUsd)} (${model})\n`;
  }

  return `\nToken Stats — Current Session\n${SEP}\n` +
    (shortPath ? `Session:  ${shortPath}\n` : '') +
    `Model:    ${model || 'unknown'}\n` +
    `Turns:    ${turns}\n${SEP}\n` +
    `Input tokens:          ${inputTokens.toLocaleString()}\n` +
    `Output tokens:         ${outputTokens.toLocaleString()}\n` +
    `Cache write tokens:    ${cacheWriteTokens.toLocaleString()}\n` +
    `Cache read tokens:     ${cacheReadTokens.toLocaleString()}\n${SEP}\n` +
    costLine +
    (price === null ? 'Pricing unavailable for this model.\n' : '');
}

function formatHistory({ sessions, inputTokens, outputTokens, cacheReadTokens, costUsd, since }) {
  const window = since ? ` (last ${since})` : '';
  if (sessions === 0) {
    return `\nToken Stats — Lifetime${window}\n${SEP}\nNo sessions logged yet.\n${SEP}\n`;
  }
  const costLine = costUsd > 0 ? `Est. total cost:       ~${fmtUsd(costUsd)}\n` : '';
  return `\nToken Stats — Lifetime${window}\n${SEP}\n` +
    `Sessions:   ${sessions.toLocaleString()}\n${SEP}\n` +
    `Input tokens:          ${fmtTokens(inputTokens)}\n` +
    `Output tokens:         ${fmtTokens(outputTokens)}\n` +
    `Cache read tokens:     ${fmtTokens(cacheReadTokens)}\n` +
    costLine + SEP + '\n';
}

function main() {
  const args = process.argv.slice(2);
  const i = args.indexOf('--session-file');
  const sessionFileArg = i !== -1 ? args[i + 1] : null;
  const all = args.includes('--all');
  const sinceIdx = args.indexOf('--since');
  const sinceArg = sinceIdx !== -1 ? args[sinceIdx + 1] : null;

  const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  const historyPath = path.join(claudeDir, '.framework-token-history.jsonl');

  if (all || sinceArg) {
    const sinceMs = parseDuration(sinceArg);
    if (sinceArg && sinceMs === null) {
      process.stderr.write(`token-stats: --since takes Nh or Nd (e.g. 7d, 24h), got: ${sinceArg}\n`);
      process.exit(2);
    }
    const agg = aggregateHistory(historyPath, sinceMs);
    process.stdout.write(formatHistory({ ...agg, since: sinceArg || null }));
    return;
  }

  const sessionFile = sessionFileArg || findLatestSession(claudeDir);
  if (!sessionFile) {
    process.stderr.write('token-stats: no Claude Code session found.\n');
    process.exit(1);
  }

  const parsed = parseSession(sessionFile);

  // Append snapshot to lifetime log if we have real data.
  if (parsed.turns > 0) {
    const price = priceFor(parsed.model);
    const costUsd = price !== null ? (parsed.outputTokens / 1_000_000) * price : 0;
    appendHistory(historyPath, JSON.stringify({
      ts: Date.now(),
      session_id: path.basename(sessionFile, '.jsonl'),
      model: parsed.model || null,
      input_tokens: parsed.inputTokens,
      output_tokens: parsed.outputTokens,
      cache_read_tokens: parsed.cacheReadTokens,
      cost_usd: costUsd,
    }));
  }

  process.stdout.write(formatSession({ ...parsed, sessionPath: sessionFile }));
}

if (require.main === module) main();

module.exports = { parseSession, aggregateHistory, formatSession, formatHistory, parseDuration, priceFor };
