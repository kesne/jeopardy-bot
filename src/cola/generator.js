import images from 'images';
import {join} from 'path';
import {tmpdir} from 'os';

import capture from './capture';

const temporaryDirectory = tmpdir();

const ASSETS = join(__dirname, '..', '..', 'assets');

const startingBoard = images(1200, 740).fill(0x00, 0x00, 0x00);
const blankValue = images(join(ASSETS, 'blank_value.png'));
const $values = {
  200: images(join(ASSETS, 'values', '200.png')),
  400: images(join(ASSETS, 'values', '400.png')),
  600: images(join(ASSETS, 'values', '600.png')),
  800: images(join(ASSETS, 'values', '800.png')),
  1000: images(join(ASSETS, 'values', '1000.png'))
};

// The y-position of the header row:
const HEADER_Y = 6;
const CLUE_OFFSET_Y = 118;
const CLUE_HEIGHT = 124;

// Pre-calcuated positions of columns
const COLUMN_LOCATIONS = [6, 205, 404, 603, 802, 1001];

const dailyDoubleUrl = 'http://i.imgur.com/EqH6Fgw.png';
export async function generateDailydouble() {
  const random = Math.round(Math.random() * 1000000);
  return `${dailyDoubleUrl}?random=${random}`;
}

export async function generateClue({game, clue}) {
  return await capture({
    view: 'clue',
    id: game.id,
    data: clue.question,
    channel_id: game.channel_id
  });
}

export async function generateBoard({game}) {
  const categoryImageFiles = await Promise.all(
    game.categories.map(category => (
      // TODO: Keep some cache of these?
      capture({
        view: 'category',
        id: `${game.id}_${category.id}`,
        data: category.title,
        size: '194x102',
        channel_id: game.channel_id
      })
    ))
  );

  const categoryImages = categoryImageFiles.map(file => images(file));

  let board = startingBoard;
  for (let col = 0; col < COLUMN_LOCATIONS.length; col++) {
    // Draw the category title:
    board = board.draw(categoryImages[col], COLUMN_LOCATIONS[col], HEADER_Y);
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

  return await saveImages(join(temporaryDirectory, `fullboard.${game.channel_id}.png`), board);
}

function saveImages(filename, images) {
  return new Promise((resolve, reject) => {
    images.saveAsync(filename, err => {
      if (err) {
        return reject(err);
      }
      resolve(filename);
    });
  });
}
