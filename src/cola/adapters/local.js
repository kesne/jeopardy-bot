// TODO: The public IP should be configurable in the admin console, instead of relying on public ip.
// This really only works on standalone linux distributions currently.

import { generateBoard, generateClue } from '../generator';
import { join } from 'path';
import { v4 } from 'public-ip';
import findRemoveSync from 'find-remove';
import { writeFile, stat } from 'fs';
import winston from 'winston';

import { PORT } from '../../config';

/**
 * HELPER FUNCTIONS:
 */

/**
 * ADAPTER:
 */

const localPath = join(__dirname, '..', '..', '..', 'assets', 'local');
const threeDays = 60 * 60 * 24 * 3;
const sixHours = 1000 * 60 * 60 * 6;

function clean() {
  findRemoveSync(localPath, {
    age: {
      seconds: threeDays,
    },
    extensions: '.png',
  });
}

export default class LocalAdapter {
  // ADAPTER CONFIGURATION:
  CAPTURE_ALL_CLUES = true;

  constructor() {
    this.getHost();
    this.startCleaning();
  }

  destroy() {
    clean();
    this.stopCleaning();
  }

  startCleaning() {
    this.interval = setInterval(clean, sixHours);
  }

  stopCleaning() {
    clearInterval(this.interval);
  }

  getHost() {
    v4((err, ip) => {
      if (err) throw err;
      this.host = `http://${ip}:${PORT}`;
    });
  }

  saveImage(fileName, buf) {
    return new Promise((resolve, reject) => {
      writeFile(join(localPath, fileName), buf, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(`${this.host}/assets/local/${fileName}`);
        }
      });
    });
  }

  // Allows captureAllClues to work:
  getClue(fileName) {
    return new Promise((resolve) => {
      stat(join(localPath, fileName), (err) => {
        if (err) {
          resolve(false);
        } else {
          winston.debug('clue returned from cache', `${this.host}/assets/local/${fileName}`);
          resolve(`${this.host}/assets/local/${fileName}`);
        }
      });
    });
  }

  async board(game) {
    const fileName = `${game.channel_id}-BOARD-${game.id}.png`;
    const boardBuffer = await generateBoard(game);
    return await this.saveImage(fileName, boardBuffer);
  }

  async clue(game, clue) {
    const fileName = `${game.channel_id}-CLUE-${game.id}-${clue.id}.png`;

    // Handle captureAllClues:
    const cachedClue = await this.getClue(fileName);
    if (cachedClue) {
      return cachedClue;
    }

    const clueBuffer = await generateClue(game, clue);
    return await this.saveImage(fileName, clueBuffer);
  }
}
