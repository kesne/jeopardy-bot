import { getContext } from "redux-saga/effects";
import { JeopardyImage } from "../../../types";

export default function* say(message: string, image?: JeopardyImage) {
  const studio = yield getContext('studio');
  const manager = yield getContext('manager');

  yield manager.sendMessage(studio, message, image);

  return;
}
