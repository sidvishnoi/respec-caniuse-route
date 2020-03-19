// Reads features-json/*.json files from caniuse repository
// and writes each file in a "respec friendly way"
//  - Keep only the `stats` from features-json data
//  - Sort browser versions (latest first)
//  - Remove footnotes and other unnecessary data

import { promises as fs, existsSync } from 'fs';
import { spawn } from 'child_process';
import * as path from 'path';
import { DATA_DIR } from './constants.js';

const { readFile, writeFile, readdir, mkdir } = fs;

interface Input {
  stats: {
    [browserName: string]: { [version: string]: string };
  };
}

interface Output {
  [browserName: string]: [string, ReturnType<typeof formatStatus>][];
}

const INPUT_DIR = path.join(DATA_DIR, './caniuse-raw/features-json/');
const OUTPUT_DIR = path.join(DATA_DIR, './caniuse/');

const log = (...args: any[]) => console.log('(caniuse/scraper)', ...args);

const defaultOptions = {
  forceUpdate: false,
};
type Options = typeof defaultOptions;

export async function main(options: Partial<Options> = {}) {
  const opts = { ...defaultOptions, ...options };
  const hasUpdated = await updateInputSource();
  if (!hasUpdated && !opts.forceUpdate) {
    log('Nothing to update');
    return false;
  }

  log('INPUT_DIR:', INPUT_DIR);
  log('OUTPUT_DIR:', OUTPUT_DIR);
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  const fileNames = await readdir(INPUT_DIR);
  log(`Processing ${fileNames.length} files...`);
  const promisesToProcess = fileNames.map(processFile);
  await Promise.all(promisesToProcess);
  log(`Processed ${fileNames.length} files.`);
  return true;
}

function updateInputSource() {
  const dataDir = path.join(DATA_DIR, './caniuse-raw');
  const shouldClone = !existsSync(dataDir);
  const args = shouldClone
    ? ['clone', 'https://github.com/Fyrd/caniuse.git', 'caniuse-raw']
    : ['pull', 'origin', 'master'];
  const cwd = shouldClone ? path.resolve(DATA_DIR) : dataDir;

  return new Promise<boolean>((resolve, reject) => {
    const git = spawn('git', args, { cwd });
    let hasUpdated = true;
    git.stdout.on('data', (data: ArrayBuffer) => {
      hasUpdated = !data.toString().includes('Already up to date');
    });
    git.on('error', reject);
    git.on('exit', (code: number) => {
      if (code !== 0) {
        reject(new Error(`The process exited with code ${code}`));
      } else {
        resolve(hasUpdated);
      }
    });
  });
}

async function processFile(fileName: string) {
  const inputFile = path.join(INPUT_DIR, fileName);
  const outputFile = path.join(OUTPUT_DIR, fileName);

  const json = await readJSON(inputFile);

  const output: Output = {};
  for (const [browserName, browserData] of Object.entries(json.stats)) {
    const stats = Object.entries(browserData)
      .sort(semverCompare)
      .map(([version, status]) => [version, formatStatus(status)])
      .reverse() as [string, string[]][];
    output[browserName] = stats;
  }

  await writeJSON(outputFile, output);
}

type BrowserDataEntry = [string, string];
/**
 * semverCompare
 * https://github.com/substack/semver-compare
 */
function semverCompare(a: BrowserDataEntry, b: BrowserDataEntry) {
  const pa = a[0].split('.');
  const pb = b[0].split('.');
  for (let i = 0; i < 3; i++) {
    const na = Number(pa[i]);
    const nb = Number(pb[i]);
    if (na > nb) return 1;
    if (nb > na) return -1;
    if (!isNaN(na) && isNaN(nb)) return 1;
    if (isNaN(na) && !isNaN(nb)) return -1;
  }
  return 0;
}

/**  @example "n d #6" => ["n", "d"] */
function formatStatus(status: string) {
  return status
    .split('#', 1)[0] // don't care about footnotes.
    .split(' ')
    .filter(item => item);
}

async function readJSON(file: string) {
  const str = await readFile(file, 'utf8');
  return JSON.parse(str) as Input;
}

async function writeJSON(file: string, json: Output) {
  const str = JSON.stringify(json);
  await writeFile(file, str);
}

if (require.main === module) {
  main({ forceUpdate: true }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
