#!/usr/bin/env node
// settings-helper.js — JSONC-tolerant settings.json read/write and hook management.
//
// Adapted from caveman (github.com/JuliusBrussee/caveman) — generalized for
// managing .claude/settings.json in any project.
//
// Public API:
//   readSettings(path)               → object, {} on missing, null on hard parse failure
//   writeSettings(path, obj)         → atomic write (temp + rename, mode 0600)
//   stripJsonComments(src)           → string with // and /* */ removed (string-aware)
//   validateHookFields(settings)     → mutates: drops malformed hook entries
//   hasHook(settings, event, marker) → idempotency probe
//   addCommandHook(settings, event, opts) → no-op if marker already present
//   removeHooks(settings, marker)    → strip all hook entries matching marker
//
// Pure stdlib, CommonJS, Node ≥14.

'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

// ── stripJsonComments ──────────────────────────────────────────────────────
// Hand-rolled state machine. Tracks string state + backslash escape so a
// comment-looking sequence inside a quoted string is left alone. Also strips
// trailing commas, which JSON.parse rejects but JSONC allows.
function stripJsonComments(src) {
  if (typeof src !== 'string') return src;
  let out = '';
  let i = 0;
  const n = src.length;
  let inString = false;
  let stringChar = '';
  let inLine  = false;
  let inBlock = false;
  while (i < n) {
    const c    = src[i];
    const next = i + 1 < n ? src[i + 1] : '';
    if (inLine)  { if (c === '\n') { inLine = false; out += c; } i++; continue; }
    if (inBlock) { if (c === '*' && next === '/') { inBlock = false; i += 2; continue; } i++; continue; }
    if (inString) {
      out += c;
      if (c === '\\') { if (i + 1 < n) { out += src[i + 1]; i += 2; continue; } }
      if (c === stringChar) inString = false;
      i++; continue;
    }
    if (c === '"' || c === "'") { inString = true; stringChar = c; out += c; i++; continue; }
    if (c === '/' && next === '/') { inLine  = true; i += 2; continue; }
    if (c === '/' && next === '*') { inBlock = true; i += 2; continue; }
    out += c; i++;
  }
  return out.replace(/,(\s*[}\]])/g, '$1');
}

// ── readSettings ──────────────────────────────────────────────────────────
// Try strict JSON first (fast path). On failure, strip comments and retry.
// Returns {} for a missing or empty file. Returns null on unrecoverable parse
// failure — never silently overwrite a malformed file with {}.
function readSettings(p) {
  if (!fs.existsSync(p)) return {};
  let raw;
  try { raw = fs.readFileSync(p, 'utf8'); }
  catch (e) { process.stderr.write(`settings-helper: cannot read ${p}: ${e.message}\n`); return null; }
  if (!raw.trim()) return {};
  try { return JSON.parse(raw); } catch (_) { /* fall through to JSONC */ }
  try { return JSON.parse(stripJsonComments(raw)); }
  catch (e) {
    process.stderr.write(`settings-helper: warning — ${p} is not valid JSON or JSONC: ${e.message}\n`);
    return null;
  }
}

// ── writeSettings ──────────────────────────────────────────────────────────
// Atomic write via temp file + rename. Mode 0600 — settings often contains tokens.
function writeSettings(p, obj) {
  const dir = path.dirname(p);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(p)}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(tmp, p);
}

// ── validateHookFields ────────────────────────────────────────────────────
// Claude Code uses strict Zod on settings.json — a single malformed hook entry
// silently discards the entire hooks section. Mutates to valid before write.
//
// Required shape:
//   settings.hooks[event] = [{ matcher?: string, hooks: [{ type: 'command', command: string, timeout?: number }] }]
function validateHookFields(settings) {
  if (!settings || typeof settings !== 'object') return settings;
  if (!settings.hooks || typeof settings.hooks !== 'object') return settings;
  for (const ev of Object.keys(settings.hooks)) {
    const arr = settings.hooks[ev];
    if (!Array.isArray(arr)) { delete settings.hooks[ev]; continue; }
    settings.hooks[ev] = arr.filter(entry => {
      if (!entry || typeof entry !== 'object') return false;
      if (!Array.isArray(entry.hooks)) return false;
      entry.hooks = entry.hooks.filter(h => {
        if (!h || typeof h !== 'object') return false;
        if (h.type === 'command') return typeof h.command === 'string' && h.command.length > 0;
        if (h.type === 'agent')   return typeof h.prompt  === 'string' && h.prompt.length  > 0;
        return false;
      });
      return entry.hooks.length > 0;
    });
    if (settings.hooks[ev].length === 0) delete settings.hooks[ev];
  }
  if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
  return settings;
}

// ── hasHook ───────────────────────────────────────────────────────────────
// Returns true if any hook command in the given event contains `marker`.
// Use before addCommandHook to check idempotency without modifying state.
function hasHook(settings, event, marker) {
  const arr = settings && settings.hooks && settings.hooks[event];
  if (!Array.isArray(arr)) return false;
  return arr.some(e =>
    e && Array.isArray(e.hooks) &&
    e.hooks.some(h => h && typeof h.command === 'string' && h.command.includes(marker))
  );
}

// ── addCommandHook ────────────────────────────────────────────────────────
// Idempotent push. opts: { command, marker?, timeout?, statusMessage? }
// `marker` defaults to opts.command — pass an explicit shorter substring
// (e.g. script basename) when the full command path may vary across installs.
// Returns true if added, false if already present.
function addCommandHook(settings, event, opts) {
  if (!settings.hooks) settings.hooks = {};
  if (!Array.isArray(settings.hooks[event])) settings.hooks[event] = [];
  const marker = opts.marker || opts.command;
  if (hasHook(settings, event, marker)) return false;
  const hook = { type: 'command', command: opts.command };
  if (typeof opts.timeout       === 'number') hook.timeout       = opts.timeout;
  if (typeof opts.statusMessage === 'string') hook.statusMessage = opts.statusMessage;
  settings.hooks[event].push({ hooks: [hook] });
  return true;
}

// ── removeHooks ───────────────────────────────────────────────────────────
// Strip every hook entry whose command contains `marker`. Returns count removed.
function removeHooks(settings, marker) {
  if (!settings || !settings.hooks) return 0;
  validateHookFields(settings);
  if (!settings.hooks) return 0;
  let removed = 0;
  for (const ev of Object.keys(settings.hooks)) {
    if (!Array.isArray(settings.hooks[ev])) { delete settings.hooks[ev]; continue; }
    const before = settings.hooks[ev].length;
    settings.hooks[ev] = settings.hooks[ev].filter(entry => {
      if (!entry || !Array.isArray(entry.hooks)) return true;
      return !entry.hooks.some(h => h && typeof h.command === 'string' && h.command.includes(marker));
    });
    removed += before - settings.hooks[ev].length;
    if (settings.hooks[ev].length === 0) delete settings.hooks[ev];
  }
  if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
  return removed;
}

module.exports = { stripJsonComments, readSettings, writeSettings, validateHookFields, hasHook, addCommandHook, removeHooks };
