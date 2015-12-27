import { generateBoard, generateClue } from './generator';
import { imgurUpload } from './imgur';
import { captureAllClues, imageForClue, s3Upload } from './s3';
import { captureAllClues as localCaptureAllClues, imageForClue as localImageForClue } from './local';
import App from '../models/App';

// This is a special image case:
export { generateDailydouble as dailydoubleImage } from './generator';

export async function captureCluesForGame({ game }) {
  const app = await App.get();
  if (app.imageMode === 's3') {
    captureAllClues(game);
  } else if (app.imageMode === 'local') {
    localCaptureAllClues(game);
  }
}

export async function boardImage({ game }) {
  const app = await App.get();
  const boardLocalUrl = await generateBoard({ game });
  if (app.imageMode === 's3') {
    return await s3Upload(boardLocalUrl);
  } else if (app.imageMode === 'local') {
    // TODO: Local stuff
    console.log('TODO: Local');
  }
  return await imgurUpload(boardLocalUrl);
}

export async function clueImage({ game }) {
  const app = await App.get();
  const clue = game.getClue();
  if (app.imageMode === 's3') {
    return await imageForClue({ game, clue });
  } else if (app.imageMode === 'local') {

  }
  const clueLocalUrl = await generateClue({ game, clue });
  return await imgurUpload(clueLocalUrl);
}
