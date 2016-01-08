export default function newClueMessage(game) {
  if (game.isBoardControlled()) {
    return `Select a new clue. <@${game.lastContestant}>, you have control of the board for ${game.studio.values.boardControlTimeout} seconds.`;
  }
  return `Select a new clue.`;
}
