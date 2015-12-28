import getAdapter from './adapters';

export async function allClueImages(game) {
  const adapter = await getAdapter();
  if (adapter.CAPTURE_ALL_CLUES) {
    console.log('TODO: Capture all clues');
  }
}

export async function boardImage(game) {
  const adapter = await getAdapter();
  return await adapter.board(game);
}

export async function clueImage(game) {
  const adapter = await getAdapter();
  const clue = game.getClue();
  return await adapter.clue(game, clue);
}

// This is a special image case:
export { generateDailydouble as dailydoubleImage } from './generator';
