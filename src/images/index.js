import { parallelLimit } from 'async';
import getAdapter from './adapters';

export async function boardImage(game) {
  const adapter = await getAdapter();
  return await adapter.board(game);
}

export async function clueImage(game, incomingClue) {
  const adapter = await getAdapter();
  const clue = incomingClue || game.getClue();
  return await adapter.clue(game, clue);
}

export async function allClueImages(game) {
  const adapter = await getAdapter();
  if (adapter.CAPTURE_ALL_CLUES) {
    // On next tick, start capturing all of the clues:
    setTimeout(() => {
      // Generate clues, 6 at a time:
      parallelLimit(game.questions.map(clue => {
        return async (callback) => {
          await clueImage(game, clue);
          callback();
        };
      }), 6);
    }, 0);
  }
}

// This is a special image case:
export { generateDailydouble as dailydoubleImage } from './generator';
