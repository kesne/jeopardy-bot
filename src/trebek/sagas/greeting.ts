import { event, say } from './utils';

export default function* greeting() {
  yield event('channel_join', function*(action) {
    yield say(
      `Welcome to <#${action.studio.id}>, <@${
        action.contestant.id
      }>! To learn how to play, just type \`help\`.`,
    );
  });
}
