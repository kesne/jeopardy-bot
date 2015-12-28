import { generateBoard, generateClue } from '../generator';
import fs from 'fs';

/**
 * HELPER FUNCTIONS:
 */


/**
 * ADAPTER:
 */

export default class LocalAdapter {
  // ADAPTER CONFIGURATION:
  CAPTURE_ALL_CLUES = true;

  constructor(filesystem = fs) {
    this.fs = filesystem;
  }

  async board(game) {
    const boardBuffer = await generateBoard(game);
    return await uploadImage(boardBuffer.toString('base64'));
  }

  async clue(game, clue) {
    const clueBuffer = await generateClue(game, clue);
    return await uploadImage(clueBuffer.toString('base64'));
  }
}

// function saveImage(filename, image) {
//   return new Promise((resolve, reject) => {
//     image.saveAsync(filename, err => {
//       if (err) {
//         return reject(err)
//       }
//       resolve(filename);
//     });
//   });
// }
//
//
//   return await saveImage(join(temporaryDirectory, `fullboard.${game.channel_id}.png`), board);
