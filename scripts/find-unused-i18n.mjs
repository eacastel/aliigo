#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const EN = path.join(SRC, 'messages', 'en.json');
const ES = path.join(SRC, 'messages', 'es.json');

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|js|mjs)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function flatten(obj, prefix = '', out = []) {
  for (const [k, v] of Object.entries(obj || {})) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, next, out);
    else out.push(next);
  }
  return out;
}

const files = walk(SRC);
const fileText = new Map(files.map((f) => [f, fs.readFileSync(f, 'utf8')]));

// pass 1: strict usage extraction from translators bound to namespace
const nsUsed = new Map(); // ns -> Set(keys)
const nsDynamic = new Set(); // ns with template/dynamic key usage

function ensureSet(ns) {
  if (!nsUsed.has(ns)) nsUsed.set(ns, new Set());
  return nsUsed.get(ns);
}

for (const [file, text] of fileText) {
  const translatorVars = [];

  const nsAssignPatterns = [
    /\b(?:const|let|var)\s+(\w+)\s*=\s*useTranslations\(\s*(["'`])([^"'`]+)\2\s*\)/g,
    /\b(?:const|let|var)\s+(\w+)\s*=\s*await\s+getTranslations\(\s*(["'`])([^"'`]+)\2\s*\)/g,
    /\b(?:const|let|var)\s+(\w+)\s*=\s*await\s+getTranslations\(\s*\{[\s\S]*?namespace\s*:\s*(["'`])([^"'`]+)\2[\s\S]*?\}\s*\)/g,
  ];

  for (const re of nsAssignPatterns) {
    let m;
    while ((m = re.exec(text))) translatorVars.push({ v: m[1], ns: m[3] });
  }

  for (const { v, ns } of translatorVars) {
    const set = ensureSet(ns);
    const callRe = new RegExp(
      "\\b" + v + "(?:\\.rich|\\.raw|\\.markup)?\\(\\s*['\\\"]([^'\\\"]+)['\\\"]",
      "g",
    );
    const templateRe = new RegExp(
      "\\b" + v + "(?:\\.rich|\\.raw|\\.markup)?\\(\\s*`([^`]*)`",
      "g",
    );
    let m;
    while ((m = callRe.exec(text))) {
      const key = m[1];
      // If ns translator is used with full key accidentally, normalize
      const normalized = key.startsWith(`${ns}.`) ? key.slice(ns.length + 1) : key;
      set.add(normalized);
    }
    while ((m = templateRe.exec(text))) {
      const key = m[1];
      if (key.includes('${')) {
        nsDynamic.add(ns);
        continue;
      }
      const normalized = key.startsWith(`${ns}.`) ? key.slice(ns.length + 1) : key;
      set.add(normalized);
    }
  }

  // t = useTranslations(); t('Namespace.key.path')
  const noNsAssign = /\b(?:const|let|var)\s+(\w+)\s*=\s*useTranslations\(\s*\)/g;
  let n;
  while ((n = noNsAssign.exec(text))) {
    const v = n[1];
    const callRe = new RegExp(
      "\\b" + v + "(?:\\.rich|\\.raw|\\.markup)?\\(\\s*['\\\"]([^'\\\"]+)['\\\"]",
      "g",
    );
    let m;
    while ((m = callRe.exec(text))) {
      const full = m[1];
      const idx = full.indexOf('.');
      if (idx <= 0) continue;
      const ns = full.slice(0, idx);
      const key = full.slice(idx + 1);
      ensureSet(ns).add(key);
    }
  }
}

// pass 2: literal full-key string search anywhere in source (conservative rescue)
const allText = [...fileText.values()].join('\n');

function isLiteralReferenced(fullKey) {
  const escaped = fullKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // quoted literal appears somewhere
  const re = new RegExp(`["'\`]${escaped}["'\`]`);
  return re.test(allText);
}

// pass 3: mark namespace as uncertain if it has dynamic-template translation usage
function statusForKey(fullKey) {
  const idx = fullKey.indexOf('.');
  if (idx <= 0) return 'used';
  const ns = fullKey.slice(0, idx);
  const key = fullKey.slice(idx + 1);

  if (isLiteralReferenced(fullKey)) return 'used';

  const set = nsUsed.get(ns);
  if (set && set.has(key)) return 'used';

  if (nsDynamic.has(ns)) return 'maybe_dynamic';

  return 'unused';
}

const en = JSON.parse(fs.readFileSync(EN, 'utf8'));
const es = JSON.parse(fs.readFileSync(ES, 'utf8'));
const enKeys = flatten(en);
const esKeys = flatten(es);

function classify(keys) {
  const used = [];
  const maybe = [];
  const unused = [];
  for (const k of keys) {
    const s = statusForKey(k);
    if (s === 'used') used.push(k);
    else if (s === 'maybe_dynamic') maybe.push(k);
    else unused.push(k);
  }
  return { used, maybe, unused };
}

const enC = classify(enKeys);
const esC = classify(esKeys);

const unusedBoth = enC.unused.filter((k) => esC.unused.includes(k));
const maybeEither = [...new Set([...enC.maybe, ...esC.maybe])].sort();

const report = {
  scannedFiles: files.length,
  passSummary: {
    pass1_namespaceExtraction: 'translator variable + namespace key extraction',
    pass2_literalRescue: 'full-key literal string rescue across source',
    pass3_dynamicNamespaceGuard: 'namespace marked maybe_dynamic when template keys detected',
  },
  counts: {
    en: { total: enKeys.length, used: enC.used.length, maybe_dynamic: enC.maybe.length, unused: enC.unused.length },
    es: { total: esKeys.length, used: esC.used.length, maybe_dynamic: esC.maybe.length, unused: esC.unused.length },
    unused_in_both: unusedBoth.length,
    maybe_dynamic_namespaces: [...nsDynamic].sort(),
  },
  sample: {
    unused_in_both_first_120: unusedBoth.slice(0, 120),
    maybe_dynamic_first_120: maybeEither.slice(0, 120),
  }
};

const outJson = path.join(ROOT, 'docs', 'i18n-unused-keys-report.json');
fs.writeFileSync(outJson, JSON.stringify(report, null, 2) + '\n');

const outMd = path.join(ROOT, 'docs', 'i18n-unused-keys-report.md');
const md = [
  '# i18n Unused Keys Report',
  '',
  `Scanned files: **${files.length}**`,
  '',
  '## Method (3 passes)',
  '1. Namespace extraction from `useTranslations/getTranslations` translator variables.',
  '2. Literal full-key rescue (quoted `"Namespace.key.path"` anywhere in source).',
  '3. Dynamic-key guard: namespace marked `maybe_dynamic` when template-based keys are detected.',
  '',
  '## Counts',
  `- EN total: ${report.counts.en.total}, used: ${report.counts.en.used}, maybe: ${report.counts.en.maybe_dynamic}, unused: ${report.counts.en.unused}`,
  `- ES total: ${report.counts.es.total}, used: ${report.counts.es.used}, maybe: ${report.counts.es.maybe_dynamic}, unused: ${report.counts.es.unused}`,
  `- Unused in both locales: ${report.counts.unused_in_both}`,
  '',
  '## Maybe-dynamic namespaces',
  report.counts.maybe_dynamic_namespaces.length
    ? report.counts.maybe_dynamic_namespaces.map((n) => `- ${n}`).join('\n')
    : '- none',
  '',
  '## Unused in both (first 120)',
  report.sample.unused_in_both_first_120.length
    ? report.sample.unused_in_both_first_120.map((k) => `- ${k}`).join('\n')
    : '- none',
].join('\n');
fs.writeFileSync(outMd, md + '\n');

console.log(`Wrote: ${path.relative(ROOT, outJson)}`);
console.log(`Wrote: ${path.relative(ROOT, outMd)}`);
console.log('Counts:', report.counts);
