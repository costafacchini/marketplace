#!/usr/bin/env node
// hooks-admin.js — Hook lifecycle management for ai-dev-framework.
// Uses settings-helper.js to read/write .claude/settings.json safely.
//
// Usage:
//   node scripts/hooks-admin.js status
//   node scripts/hooks-admin.js on  [hook-name]   # enable one or all default hooks
//   node scripts/hooks-admin.js off [hook-name]   # disable one or all hooks
//   node scripts/hooks-admin.js log               # tail today's audit log

'use strict';

const fs   = require('fs');
const path = require('path');

const helperPath   = path.join(__dirname, 'settings-helper.js');
const registryPath = path.join(__dirname, '..', '.claude', 'hooks', 'registry.json');
const settingsPath = path.join(process.cwd(), '.claude', 'settings.json');

const { readSettings, writeSettings, addCommandHook, removeHooks, hasHook, validateHookFields } =
  require(helperPath);

function loadRegistry() {
  if (!fs.existsSync(registryPath)) {
    process.stderr.write(`hooks-admin: registry not found at ${registryPath}\n`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(registryPath, 'utf8')).hooks;
}

// Derive a stable, unique marker from the hook's command string.
// Uses the script filename (e.g. "pre-tool-use.sh") so hasHook can
// reliably find it inside the stored command value.
function markerFor(hook) {
  const parts = hook.command.split(/\s+/);
  return path.basename(parts[parts.length - 1]);
}

const [,, cmd, hookName] = process.argv;
const registry = loadRegistry();

switch (cmd) {
  case 'status': {
    const settings = readSettings(settingsPath) || {};
    console.log('Hook status — .claude/settings.json\n');
    for (const hook of registry) {
      const active = hasHook(settings, hook.event, markerFor(hook));
      const state  = active ? '[ON] ' : '[OFF]';
      console.log(`  ${hook.name.padEnd(20)} ${state}  ${hook.event.padEnd(14)} ${hook.description}`);
    }
    console.log("\nRun 'node scripts/hooks-admin.js on <name>' to enable, 'off <name>' to disable.");
    break;
  }

  case 'on': {
    const settings = readSettings(settingsPath) || {};
    const targets  = hookName
      ? registry.filter(h => h.name === hookName)
      : registry.filter(h => h.enabled_by_default);
    if (!targets.length) {
      process.stderr.write(`hooks-admin: hook '${hookName}' not found in registry.\n`);
      process.exit(1);
    }
    let added = 0;
    for (const hook of targets) {
      const ok = addCommandHook(settings, hook.event, { command: hook.command, marker: markerFor(hook) });
      if (ok) added++;
    }
    validateHookFields(settings);
    writeSettings(settingsPath, settings);
    console.log(`${added} hook(s) enabled.`);
    break;
  }

  case 'off': {
    const settings = readSettings(settingsPath) || {};
    const targets  = hookName ? registry.filter(h => h.name === hookName) : registry;
    let removed = 0;
    for (const hook of targets) {
      removed += removeHooks(settings, markerFor(hook));
    }
    writeSettings(settingsPath, settings);
    console.log(`${removed} hook(s) disabled.`);
    break;
  }

  case 'log': {
    const logDir  = path.join(process.cwd(), '.ai-memory', 'audit');
    const today   = new Date().toISOString().slice(0, 10);
    const logFile = path.join(logDir, `writes-${today}.log`);
    if (!fs.existsSync(logFile)) {
      console.log('No audit log for today.');
    } else {
      const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n').slice(-50);
      console.log(lines.join('\n'));
    }
    break;
  }

  default:
    console.log('Usage: node scripts/hooks-admin.js <status|on|off|log> [hook-name]');
    process.exit(1);
}
