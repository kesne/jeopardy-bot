/*
 * Electron-Prebuilt has a nasty bug that prevents it from working on Heroku.
 * This fixes it with a runtime patch.
 *
 * NOTE: This is probably very dangerous and very bad. Don't do this.
 *
 * This is fixed here: https://github.com/mafintosh/electron-prebuilt/pull/80
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
const pathTxtFile = join(
  dirname(require.resolve('electron-screenshot-service')),
  '..',
  'node_modules',
  'electron-prebuilt',
  'path.txt'
);

const pathTxt = readFileSync(pathTxtFile, 'utf8');

const electronPath = '/electron-prebuilt/';

const updatedPath = join(
  pathTxtFile,
  '..',
  pathTxt.substring(pathTxt.indexOf(electronPath) + electronPath.length)
);

writeFileSync(
  pathTxtFile,
  updatedPath,
  'utf8'
);
