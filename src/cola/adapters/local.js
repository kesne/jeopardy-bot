import { generateBoard, generateClue } from '../generator';
import { join } from 'path';
import findRemoveSync from 'find-remove';
import { writeFile, stat } from 'fs';
import winston from 'winston';

import App from '../../models/App';

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

  saveImage(fileName, buf) {
    return new Promise(async (resolve, reject) => {
      const app = await App.get();
      writeFile(join(localPath, fileName), buf, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(`${app.host}/assets/local/${fileName}?t=${Date.now()}`);
        }
      });
    });
  }

  // Allows captureAllClues to work:
  getClue(fileName) {
    return new Promise(async (resolve) => {
      const app = await App.get();
      stat(join(localPath, fileName), (err) => {
        if (err) {
          resolve(false);
        } else {
          winston.debug('clue returned from cache', `${app.host}/assets/local/${fileName}`);
          resolve(`${app.host}/assets/local/${fileName}?t=${Date.now()}`);
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
    const app = await App.get();
    const fileName = `${game.channel_id}-CLUE-${game.id}-${clue.id}.png`;

    // Handle captureAllClues:
    const cachedClue = await this.getClue(fileName);
    if (cachedClue) {
      return cachedClue;
    }

    const clueBuffer = await generateClue(game, clue);

    winston.debug('clue generated', `${app.host}/assets/local/${fileName}`);
    return await this.saveImage(fileName, clueBuffer);
  }
}
