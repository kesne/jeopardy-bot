import images from 'images';
import { join } from 'path';
import Imagemin from 'imagemin';
import imageminPngQuant from 'imagemin-pngquant';
import screenshot from 'electron-screenshot-service';
import winston from 'winston';

import { PORT } from '../config';

// Promise helper method to minify images.
async function minifyImage(buf) {
  return new Promise((resolve, reject) => {
    new Imagemin()
      .src(buf)
      .use(imageminPngQuant({ quality: '75-90', speed: 5 }))
      .run((err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files[0].contents);
        }
      });
  });
}

async function screenshotToBuffer({ view, data, height = 740, width = 1200 }) {
  winston.profile('image capture');
  const { data: buf } = await screenshot({
    url: `http://localhost:${PORT}/renderable/${view}?data=${encodeURIComponent(data)}`,
    width,
    height,
  });
  winston.profile('image capture');

  winston.profile('image minification');
  const image = await minifyImage(buf);
  winston.profile('image minification');

  return image;
}

const ASSETS = join(__dirname, '..', '..', 'assets');

const startingBoard = images(1200, 740).fill(0x00, 0x00, 0x00);
const blankValue = images(join(ASSETS, 'blank_value.png'));
const $values = {
  200: images(join(ASSETS, 'values', '200.png')),
  400: images(join(ASSETS, 'values', '400.png')),
  600: images(join(ASSETS, 'values', '600.png')),
  800: images(join(ASSETS, 'values', '800.png')),
  1000: images(join(ASSETS, 'values', '1000.png')),
};

// The y-position of the header row:
const CLUE_OFFSET_Y = 118;
const CLUE_HEIGHT = 124;

// Pre-calcuated positions of columns
const COLUMN_LOCATIONS = [6, 205, 404, 603, 802, 1001];

const dailyDoubleUrl = 'http://i.imgur.com/EqH6Fgw.png';

export async function generateDailydouble() {
  const random = Math.round(Math.random() * 1000000);
  return `${dailyDoubleUrl}?random=${random}`;
}

export async function generateClue(game, clue) {
  return await screenshotToBuffer({
    view: 'clue',
    data: clue.question,
  });
}

export async function generateBoard(game) {
  const categoriesImageFile = await screenshotToBuffer({
    view: 'categories',
    width: 1200,
    height: 120,
    data: game.categories.map(cat => cat.title).join('@@~~AND~~@@'),
  });

  winston.profile('node board generation');
  // We force a resize here because otherwise retina devices show a 2x image:
  const categoriesImage = images(categoriesImageFile).size(1200);

  let board = startingBoard;
  board.draw(categoriesImage, 0, 0);
  for (let col = 0; col < COLUMN_LOCATIONS.length; col++) {
    for (let row = 0; row < 5; row++) {
      // Draw the dollar values:
      const question = game.questions[(row * 6) + col];
      board = board.draw(
        question.answered ?
          blankValue :
          $values[String(question.value)],
        COLUMN_LOCATIONS[col],
        (CLUE_HEIGHT * row) + CLUE_OFFSET_Y
      );
    }
  }
  winston.profile('node board generation');

  return board.encode('png');
}
