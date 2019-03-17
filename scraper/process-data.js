#!/usr/bin/env node

// Reads features-json/*.json files from caniuse repository
// and writes each file in a "respec friendly way"
//  - Keep only the `stats` from features-json data
//  - Sort browser versions (latest first)
//  - Remove footnotes and other unnecessary data

/**
 * @typedef {{ [browserName: string]: { [version: string]: string } }} InputStats
 * @typedef {{ [browserName: string]: [string, string[]][] }} OutputStats
 */

const { readFile, readdir, mkdirSync, existsSync, writeFile } = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const readDirAsync = promisify(readdir);

const INPUT_DIR = path.resolve('./caniuse-data/features-json/');
const OUTPUT_DIR = path.resolve('./caniuse-data-respec/');

async function main() {
  console.log('INPUT_DIR:', INPUT_DIR);
  console.log('OUTPUT_DIR:', OUTPUT_DIR);
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR);
  }

  const fileNames = await readDirAsync(INPUT_DIR);
  console.log(`Processing ${fileNames.length} files...`);
  const promisesToProcess = fileNames.map(processFile);
  await Promise.all(promisesToProcess);
  console.log(`Processed ${fileNames.length} files.`);
}

/** @param {string} fileName */
async function processFile(fileName) {
  const inputFile = path.join(INPUT_DIR, fileName);
  const outputFile = path.join(OUTPUT_DIR, fileName);

  /** @type { { stats: InputStats } } */
  const json = await readJSON(inputFile);

  /** @type {OutputStats} */
  const output = Object.entries(json.stats).reduce((output, data) => {
    const [browserName, browserData] = data;
    const stats = Object.entries(browserData)
      .sort(semverCompare)
      .map(([version, status]) => [version, formatStatus(status)])
      .reverse();
    output[browserName] = stats;
    return output;
  }, {});

  await writeJSON(outputFile, output);
}

/**
 * semverCompare
 * https://github.com/substack/semver-compare
 * @typedef {[string, string]} BrowserDataEntry
 * @param {BrowserDataEntry} a
 * @param {BrowserDataEntry} b
 */
function semverCompare(a, b) {
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

/**
 * @param {string} status
 * @example "n d #6" => ["n", "d"]
 * */
function formatStatus(status) {
  return status
    .split('#', 1)[0] // don't care about footnotes.
    .split(' ')
    .filter(item => item);
}

/** @param {string} file */
async function readJSON(file) {
  const str = await readFileAsync(file, 'utf8');
  return JSON.parse(str);
}

/** @param {string} file, @param {OutputStats} json */
async function writeJSON(file, json) {
  const str = JSON.stringify(json);
  await writeFileAsync(file, str);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
