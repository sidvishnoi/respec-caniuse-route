import { resolve } from 'path';

if (!process.env.DATA_DIR) {
  throw new Error('DATA_DIR env variable must be set');
}
export const DATA_DIR = resolve(process.env.DATA_DIR);

export const BROWSERS = new Map([
  ['and_chr', 'Chrome (Android)'],
  ['and_ff', 'Firefox (Android)'],
  ['and_uc', 'UC Browser (Android)'],
  ['android', 'Android'],
  ['bb', 'Blackberry'],
  ['chrome', 'Chrome'],
  ['edge', 'Edge'],
  ['firefox', 'Firefox'],
  ['ie', 'IE'],
  ['ios_saf', 'Safari (iOS)'],
  ['op_mini', 'Opera Mini'],
  ['op_mob', 'Opera Mobile'],
  ['opera', 'Opera'],
  ['safari', 'Safari'],
  ['samsung', 'Samsung Internet'],
]);

// Keys from https://github.com/Fyrd/caniuse/blob/master/CONTRIBUTING.md
export const SUPPORT_TITLES = new Map([
  ['y', 'Supported.'],
  ['a', 'Almost supported (aka Partial support).'],
  ['n', 'No support, or disabled by default.'],
  ['p', 'No support, but has Polyfill.'],
  ['u', 'Support unknown.'],
  ['x', 'Requires prefix to work.'],
  ['d', 'Disabled by default (needs to enabled).'],
]);
