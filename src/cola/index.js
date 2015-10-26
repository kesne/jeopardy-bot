import {generateBoard, generateClue} from './generator';
import {imgurUpload} from './imgur';
import {captureAllClues, imageForClue, s3Upload} from './s3';
import * as config from '../config';

// This is a special image case:
export {generateDailydouble as dailydoubleImage} from './generator';

export function captureCluesForGame({game}) {
  if (config.AWS) {
    captureAllClues(game);
  }
}

export async function boardImage({game}) {
  const boardLocalUrl = await generateBoard({game});
  if (config.AWS) {
    return await s3Upload(boardLocalUrl);
  } else {
    return await imgurUpload(boardLocalUrl);
  }
}

export async function clueImage({game}) {
  const clue = game.getClue();
  if (config.AWS) {
    return await imageForClue({game, clue});
  } else {
    const clueLocalUrl = await generateClue({game, clue});
    return await imgurUpload(clueLocalUrl);
  }
}
