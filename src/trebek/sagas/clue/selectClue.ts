import { say } from "../utils";
import { boardImage } from "../../../images";
import { select, getContext } from "redux-saga/effects";

export default function* selectClue(initial = false) {
    // TODO: Board control:
    // if (game.isBoardControlled()) {
    //   return `Select a new clue. <@${game.lastContestant}>, you have control of the board for ${game.studio.values.boardControlTimeout} seconds.`;
    // }
    const studio = yield getContext('studio');
    const game = yield select(({ games }) => games[studio]);
    const image = yield boardImage(game);

    if (initial) {
      yield say("Let's get this game started! Go ahead and select a category and value.", image);
    } else {
      yield say('Select a new clue.', image);
    }
  }
