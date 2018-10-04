import { getContext } from "redux-saga/effects";

export default function* say(message: string) {
  const studio = yield getContext('studio');
  const manager = yield getContext('manager');

  manager.sendMessage(studio, message);

  return;
}
