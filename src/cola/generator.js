import images from 'images';
import { join } from 'path';
import Pageres from 'pageres';
import Imagemin from 'imagemin';
import getStream from 'get-stream';
import imageminPngQuant from 'imagemin-pngquant';

import { PORT } from '../config';

// Promise helper method to minify images.
async function minifyImage(buf) {
  return new Promise((resolve, reject) => {
    new Imagemin()
      .src(buf)
      .use(imageminPngQuant({ quality: '65-80', speed: 7 }))
      .run((err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files[0].contents);
        }
      });
  });
}

async function screenshotToBuffer({ id, channel_id, view, data, size = '1200x740' }) {
  const filename = `${channel_id}.${view}.${id}`;

  console.time('Image Capture');
  const streams = await new Pageres()
    .src(
      `localhost:${PORT}/renderable/${view}?data=${encodeURIComponent(data)}`,
      [size],
      { crop: false, filename }
    )
    .run();
  console.timeEnd('Image Capture');

  // Extract the one stream we want:
  const buf = await getStream.buffer(streams[0]);

  console.time('Image Minification');
  const image = await minifyImage(buf);
  console.timeEnd('Image Minification');

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

export async function generateClue({ game, clue }) {
  return await screenshotToBuffer({
    view: 'clue',
    id: `${game.id}_${clue.id}`,
    data: clue.question,
    channel_id: game.channel_id,
  });
}

export async function generateBoard({ game }) {
  const categoriesImageFile = await screenshotToBuffer({
    view: 'categories',
    id: `${game.id}_categories`,
    size: '1200x102',
    data: game.categories.map(cat => cat.title).join('@@~~AND~~@@'),
    channel_id: game.channel_id,
  });

  const categoriesImage = images(categoriesImageFile);

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

  return board.encode('png');
}
