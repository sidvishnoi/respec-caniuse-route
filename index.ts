import * as path from 'path';
import { promises as fs } from 'fs';
import { DATA_DIR, BROWSERS, SUPPORT_TITLES } from './constants.js';

interface Options {
  feature: string;
  browsers?: string[];
  versions?: number;
  format?: 'html' | 'json';
}
type NormalizedOptions = Required<Options>;

type SupportKeys = ('y' | 'n' | 'a' | string)[];
// [ version, ['y', 'n'] ]
type BrowserVersionData = [string, SupportKeys];

interface Data {
  [browserName: string]: BrowserVersionData[];
}

const defaultOptions = {
  browsers: ['chrome', 'firefox', 'safari', 'edge'],
  versions: 4,
};

export const cache = new Map<string, Data>();

export async function createResponseBody(options: Options) {
  const opts = normalizeOptions(options);

  switch (opts.format) {
    case 'json':
      return await createResponseBodyJSON(opts);
    case 'html':
    default:
      return await createResponseBodyHTML(opts);
  }
}

export async function createResponseBodyJSON(options: NormalizedOptions) {
  const { feature, browsers, versions } = options;
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
    response[browser] = browserData.slice(0, versions);
  }
  return response;
}

export async function createResponseBodyHTML(options: NormalizedOptions) {
  const data = await createResponseBodyJSON(options);
  return data === null ? null : formatAsHTML(options, data);
}

function normalizeOptions(options: Options): NormalizedOptions {
  const feature = options.feature;
  const versions = options.versions || defaultOptions.versions;
  const browsers = sanitizeBrowsersList(options.browsers);
  const format = options.format === 'html' ? 'html' : 'json';
  return { feature, versions, browsers, format };
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

function formatAsHTML(options: NormalizedOptions, data: Data) {
  const getSupport = (supportKeys: SupportKeys) => {
    const titles = supportKeys
      .filter(key => SUPPORT_TITLES.has(key))
      .map(key => SUPPORT_TITLES.get(key)!);
    return {
      className: `caniuse-cell ${supportKeys.join(' ')}`,
      title: titles.join(' '),
    };
  };

  const addLatestVersion = (
    browserName: string,
    [version, supportKeys]: [string, SupportKeys],
  ) => {
    const { className, title } = getSupport(supportKeys);
    const text = `${BROWSERS.get(browserName) || browserName} ${version}`;
    return `<button class="${className}" title="${title}">${text}</button>`;
  };

  const addBrowserVersion = ([version, supportKeys]: [string, SupportKeys]) => {
    const { className, title } = getSupport(supportKeys);
    return `<li class="${className}" title="${title}">${version}</li>`;
  };

  let result = '';
  for (const [browser, browserData] of Object.entries(data)) {
    const [latestVersion, ...olderVersions] = browserData;
    result += `
      <div class="caniuse-browser">
        ${addLatestVersion(browser, latestVersion)}
        <ul>
          ${olderVersions.map(addBrowserVersion).join('')}
        </ul>
      </div>
    `;
  }
  const featureURL = new URL(options.feature, 'https://caniuse.com/').href;
  result += `<a href="${featureURL}" title="Get details at caniuse.com">More info </a>`;

  return result;
}
