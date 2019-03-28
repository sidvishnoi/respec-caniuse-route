const path = require('path');
const { readFile } = require('fs');
const { promisify } = require('util');

const readFileAsync = promisify(readFile);
const DATA_DIR = path.resolve(__dirname,'../../caniuse-data-respec/');

const defaultOptions = {
  browsers: ['chrome', 'firefox', 'safari', 'edge'],
  versions: 4,
};

const allowedBrowsers = new Set([
  'and_chr',
  'and_ff',
  'and_uc',
  'android',
  'bb',
  'chrome',
  'edge',
  'firefox',
  'ie',
  'ios_saf',
  'op_mini',
  'op_mob',
  'opera',
  'safari',
  'samsung',
]);

/** @typedef {{ [browserName: string]: [string, string[]][] }} Output */
/** @type {Map<string, Output>} */
const cache = new Map();

async function createResponseBody(options = {}) {
  const feature = options.feature;
  const numVersions = options.versions || defaultOptions.versions;
  const browsers = sanitizeBrowsersList(options.browsers);

  const data = await getData(feature);
  if (!browsers.length) {
    browsers.push(Object.keys(data));
  }

  /** @type {Output} */
  const response = Object.create(null);
  for (const browser of browsers) {
    const browserData = data[browser] || [];
    response[browser] = browserData.slice(0, numVersions);
  }
  return response;
}

function sanitizeBrowsersList(browsers) {
  if (!Array.isArray(browsers)) {
    if (browsers === 'all') return [];
    return defaultOptions.browsers;
  }
  const filtered = browsers.filter(browser => allowedBrowsers.has(browser));
  return filtered.length ? filtered : defaultOptions.browsers;
}

/** @param {string} feature */
async function getData(feature) {
  if (cache.has(feature)) {
    return cache.get(feature);
  }
  const file = path.format({ dir: DATA_DIR, name: `${feature}.json` });
  try {
    const str = await readFileAsync(file, 'utf8');
    /** @type {Output} */
    const data = JSON.parse(str);
    cache.set(feature, data);
    return data;
  } catch (error) {
    console.error(error);
    return {};
  }
}

module.exports = {
  createResponseBody,
  cache,
};
