import * as path from 'path';
import { promises as fs } from 'fs';
import { DATA_DIR, BROWSERS } from './constants.js';

interface Options {
  feature: string;
  browsers?: string[];
  versions?: number;
}

// [ version, ['y', 'n'] ]
type BrowserVersionData = [string, ('y' | 'n' | 'a' | string)[]];

interface Data {
  [browserName: string]: BrowserVersionData[];
}

const defaultOptions = {
  browsers: ['chrome', 'firefox', 'safari', 'edge'],
  versions: 4,
};

export const cache = new Map<string, Data>();

export async function createResponseBody(options: Options) {
  const feature = options.feature;
  const numVersions = options.versions || defaultOptions.versions;
  const browsers = sanitizeBrowsersList(options.browsers);

  const data = await getData(feature);
  if (!data) {
    return null;
  }

  if (!browsers.length) {
    browsers.push(...Object.keys(data));
  }

  const response: Data = Object.create(null);
  for (const browser of browsers) {
    const browserData = data[browser] || [];
    response[browser] = browserData.slice(0, numVersions);
  }
  return response;
}

function sanitizeBrowsersList(browsers?: string | string[]) {
  if (!Array.isArray(browsers)) {
    if (browsers === 'all') return [];
    return defaultOptions.browsers;
  }
  const filtered = browsers.filter(browser => BROWSERS.has(browser));
  return filtered.length ? filtered : defaultOptions.browsers;
}

async function getData(feature: string) {
  if (cache.has(feature)) {
    return cache.get(feature) as Data;
  }
  const file = path.format({
    dir: path.join(DATA_DIR, 'caniuse'),
    name: `${feature}.json`,
  });

  try {
    const str = await fs.readFile(file, 'utf8');
    const data: Data = JSON.parse(str);
    cache.set(feature, data);
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}
