import { say } from "../utils";

export default function* selectClue() {
    // TODO: Board control:
    // if (game.isBoardControlled()) {
    //   return `Select a new clue. <@${game.lastContestant}>, you have control of the board for ${game.studio.values.boardControlTimeout} seconds.`;
    // }
    yield say('Select a new clue.');
  }
