#!/usr/bin/env node
// distribute-rules.js — deploy AGENTS.md rules to every IDE/agent that
// supports per-repo rule files. Idempotent. Safe to re-run.
//
// Usage:
//   node scripts/distribute-rules.js [target-dir] [options]
//
// Options:
//   --source <file>   rule file to read (default: AGENTS.md in target-dir)
//   --dry-run         show what would change, do not write
//   --force           overwrite existing rule files (default: skip replace-mode files)
//   --only <id>       install for one agent only (cursor|windsurf|cline|copilot|opencode|codex)
//   --uninstall       remove distributed rule blocks
//   --help            show this message
//
// Adapted from caveman (github.com/JuliusBrussee/caveman) — generalized for
// distributing any AGENTS.md to multi-IDE targets.

const fs = require('fs');
const path = require('path');

const BEGIN_SENTINEL = '<!-- framework-rules-begin -->';
const END_SENTINEL   = '<!-- framework-rules-end -->';

// Targets. mode: 'replace' = entire file is the rule (create/overwrite).
//          mode: 'append'  = append marker-fenced block to existing file.
const AGENTS = [
  {
    id: 'cursor',
    file: '.cursor/rules/agents.mdc',
    frontmatter: '---\ndescription: "AI agent conventions for this project"\nalwaysApply: true\n---\n\n',
    mode: 'replace',
  },
  {
    id: 'windsurf',
    file: '.windsurf/rules/agents.md',
    frontmatter: '---\ntrigger: always_on\n---\n\n',
    mode: 'replace',
  },
  {
    id: 'cline',
    file: '.clinerules/agents.md',
    frontmatter: '',
    mode: 'replace',
  },
  {
    id: 'copilot',
    file: '.github/copilot-instructions.md',
    frontmatter: '',
    mode: 'append',
  },
  {
    id: 'opencode',
    file: '.opencode/AGENTS.md',
    frontmatter: '',
    mode: 'append',
  },
  {
    id: 'codex',
    file: '.codex/agents.md',
    frontmatter: '',
    mode: 'replace',
  },
];

function loadRuleBody(targetDir, sourceFile) {
  const candidates = sourceFile
    ? [path.resolve(sourceFile), path.resolve(targetDir, sourceFile)]
    : [path.join(targetDir, 'AGENTS.md'), path.join(targetDir, 'CLAUDE.md')];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8').trimEnd() + '\n';
    } catch (e) {}
  }
  return null;
}

function fencedBlock(ruleBody) {
  return BEGIN_SENTINEL + '\n' + ruleBody + END_SENTINEL + '\n';
}

function stripFencedBlock(content) {
  const re = new RegExp(
    '\\n?' + escapeRegex(BEGIN_SENTINEL) + '[\\s\\S]*?' + escapeRegex(END_SENTINEL) + '\\n?',
    'g'
  );
  return content.replace(re, '');
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processAgent(agent, targetDir, ruleBody, opts) {
  const fullPath = path.join(targetDir, agent.file);
  const exists   = fs.existsSync(fullPath);

  if (opts.uninstall) {
    if (!exists) return { status: 'not-installed', label: '-' };
    const content = fs.readFileSync(fullPath, 'utf8');
    if (!content.includes(BEGIN_SENTINEL)) return { status: 'not-installed', label: '-' };
    if (!opts.dryRun) {
      if (agent.mode === 'replace') {
        fs.unlinkSync(fullPath);
      } else {
        fs.writeFileSync(fullPath, stripFencedBlock(content), { mode: 0o644 });
      }
    }
    return { status: 'removed', label: 'x' };
  }

  const block = fencedBlock(ruleBody);

  if (!exists) {
    if (!opts.dryRun) {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      const body = agent.mode === 'replace' ? agent.frontmatter + ruleBody : block;
      fs.writeFileSync(fullPath, body, { mode: 0o644 });
    }
    return { status: 'added', label: '+' };
  }

  const existing = fs.readFileSync(fullPath, 'utf8');

  if (existing.includes(BEGIN_SENTINEL)) {
    if (!opts.force) return { status: 'already-installed', label: '=' };
    // --force: update the fenced block in place
    if (!opts.dryRun) {
      if (agent.mode === 'replace') {
        fs.writeFileSync(fullPath, agent.frontmatter + ruleBody, { mode: 0o644 });
      } else {
        fs.writeFileSync(fullPath, stripFencedBlock(existing) + '\n' + block, { mode: 0o644 });
      }
    }
    return { status: 'updated', label: '~' };
  }

  if (agent.mode === 'append') {
    if (!opts.dryRun) {
      const sep = existing.endsWith('\n\n') ? '' : existing.endsWith('\n') ? '\n' : '\n\n';
      fs.writeFileSync(fullPath, existing + sep + block, { mode: 0o644 });
    }
    return { status: 'appended', label: '+' };
  }

  // replace mode — file exists but doesn't have our block
  if (opts.force) {
    if (!opts.dryRun) {
      fs.writeFileSync(fullPath, agent.frontmatter + ruleBody, { mode: 0o644 });
    }
    return { status: 'overwritten', label: '!' };
  }

  return { status: 'skipped-exists', label: '?' };
}

function parseArgs(argv) {
  const opts = {
    dryRun: false,
    force: false,
    uninstall: false,
    only: null,
    source: null,
    target: process.cwd(),
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run')              opts.dryRun = true;
    else if (a === '--force' || a === '-f') opts.force = true;
    else if (a === '--uninstall')       opts.uninstall = true;
    else if (a === '--only')            opts.only = argv[++i];
    else if (a === '--source')          opts.source = argv[++i];
    else if (a === '-h' || a === '--help') opts.help = true;
    else if (!a.startsWith('-'))        opts.target = path.resolve(a);
  }
  return opts;
}

function help() {
  process.stdout.write(`distribute-rules — deploy AGENTS.md to all supported IDE/agent rule files

Usage: node scripts/distribute-rules.js [target-dir] [options]

Options:
  --source <file>   rule file to read (default: AGENTS.md or CLAUDE.md in target-dir)
  --dry-run         show what would change, do not write
  --force           overwrite or update existing rule files
  --only <id>       install for one agent only
  --uninstall       remove all distributed rule blocks
  --help            show this message

Targets:
${AGENTS.map(a => `  ${a.id.padEnd(10)} ${a.file}`).join('\n')}

Legend: + added  ~ updated/appended  ! overwritten  = already installed  ? skipped  x removed
`);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { help(); return; }

  const ruleBody = loadRuleBody(opts.target, opts.source);
  if (!ruleBody && !opts.uninstall) {
    process.stderr.write(`distribute-rules: no rule source found. Expected AGENTS.md or CLAUDE.md in ${opts.target}\nUse --source <file> to specify a custom source.\n`);
    process.exit(1);
  }

  const action = opts.uninstall ? 'uninstall' : opts.dryRun ? 'dry run' : 'install';
  process.stdout.write(`distribute-rules — ${opts.target} (${action})\n\n`);

  const counts = { added: 0, appended: 0, updated: 0, overwritten: 0, removed: 0, skipped: 0 };

  for (const agent of AGENTS) {
    if (opts.only && opts.only !== agent.id) continue;
    const result = processAgent(agent, opts.target, ruleBody || '', opts);
    process.stdout.write(`  ${result.label} ${agent.file} (${result.status})\n`);
    if (result.status === 'added')             counts.added++;
    else if (result.status === 'appended')     counts.appended++;
    else if (result.status === 'updated')      counts.updated++;
    else if (result.status === 'overwritten')  counts.overwritten++;
    else if (result.status === 'removed')      counts.removed++;
    else                                       counts.skipped++;
  }

  process.stdout.write(`\n${counts.added} added, ${counts.appended} appended, ${counts.updated} updated, `
    + `${counts.overwritten} overwritten, ${counts.removed} removed, ${counts.skipped} skipped\n`);
  if (opts.dryRun) process.stdout.write('(dry run — no files were written)\n');
}

if (require.main === module) main();

module.exports = { processAgent, loadRuleBody, AGENTS, BEGIN_SENTINEL, END_SENTINEL };
