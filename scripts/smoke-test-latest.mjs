#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const repoRoot = process.cwd();
loadDotEnv(path.join(repoRoot, '.env.local'));
loadDotEnv(path.join(repoRoot, '.env.example'));

const apiKey = process.env.LLAMAGEN_API_KEY;
if (!apiKey || apiKey === 'YOUR_API_KEY') {
  throw new Error('LLAMAGEN_API_KEY is missing. Set it in .env.local or environment variables.');
}

const prompt =
  process.env.SMOKE_PROMPT ||
  'american comic illustration, bold, thick outlines,vibrant, high-contrast colors, A superhero cat saving a city from giant mice';
const intervalMs = Number(process.env.SMOKE_INTERVAL_MS || 5000);
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 180000);

const smokeRoot = path.join(repoRoot, '.local-smoke');
const runnerDir = path.join(smokeRoot, 'latest-sdk-runner');
const runId = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(smokeRoot, 'results', runId);
const imagesDir = path.join(outDir, 'images');

fs.mkdirSync(runnerDir, { recursive: true });
fs.mkdirSync(imagesDir, { recursive: true });

if (!fs.existsSync(path.join(runnerDir, 'package.json'))) {
  execSync('npm init -y', { cwd: runnerDir, stdio: 'ignore' });
}

execSync('npm i comic@latest', { cwd: runnerDir, stdio: 'inherit' });

const requireFromRunner = createRequire(path.join(runnerDir, 'package.json'));
const { LlamaGenClient } = requireFromRunner('comic');

const llamagen = new LlamaGenClient({ apiKey });

console.log('[smoke] creating comic generation...');
const created = await llamagen.comic.create({
  prompt,
  preset: 'neutral',
  size: '1024x1024'
});

writeJson(path.join(outDir, 'create_response.json'), created);

console.log(`[smoke] waiting for completion: ${created.id}`);
const finalResult = await llamagen.comic.waitForCompletion(created.id, {
  intervalMs,
  timeoutMs
});

writeJson(path.join(outDir, 'final_response.json'), finalResult);

const imageUrls = Array.from(collectImageUrls(finalResult));
console.log(`[smoke] image urls found: ${imageUrls.length}`);

const downloaded = [];
for (let i = 0; i < imageUrls.length; i += 1) {
  const url = imageUrls[i];
  try {
    const ext = inferExt(url);
    const filename = `image_${String(i + 1).padStart(3, '0')}${ext}`;
    const target = path.join(imagesDir, filename);
    await download(url, target);
    downloaded.push({ url, file: target });
  } catch (error) {
    downloaded.push({ url, error: error instanceof Error ? error.message : String(error) });
  }
}

const summary = {
  runId,
  packageVersion: readInstalledComicVersion(runnerDir),
  prompt,
  createId: created.id,
  finalStatus: finalResult.status,
  outputDir: outDir,
  imagesDownloaded: downloaded
};

writeJson(path.join(outDir, 'summary.json'), summary);
console.log(`[smoke] done. output: ${outDir}`);

function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function collectImageUrls(input, acc = new Set()) {
  if (input == null) return acc;
  if (typeof input === 'string') {
    if (/^https?:\/\//.test(input) && /\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(input)) {
      acc.add(input);
    }
    return acc;
  }
  if (Array.isArray(input)) {
    for (const item of input) collectImageUrls(item, acc);
    return acc;
  }
  if (typeof input === 'object') {
    for (const v of Object.values(input)) collectImageUrls(v, acc);
  }
  return acc;
}

function inferExt(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const m = pathname.match(/\.(png|jpg|jpeg|webp|gif)$/);
    if (m) return `.${m[1]}`;
  } catch {
    // noop
  }
  return '.webp';
}

async function download(url, target) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`download failed: ${res.status}`);
  }
  const ab = await res.arrayBuffer();
  fs.writeFileSync(target, Buffer.from(ab));
}

function readInstalledComicVersion(baseDir) {
  const pkgFile = path.join(baseDir, 'node_modules', 'comic', 'package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}
