import { resolve } from 'path';

if (!process.env.DATA_DIR) {
  throw new Error('DATA_DIR env variable must be set');
}
export const DATA_DIR = resolve(process.env.DATA_DIR);

export const BROWSERS = new Set([
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
