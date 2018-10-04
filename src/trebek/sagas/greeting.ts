import { event, say } from './utils';

export default function* greeting() {
  yield event('member_joined_channel', function*(action) {
    yield say(
      `Welcome to <#${action.studio}>, <@${
        action.contestant
      }>! To learn how to play, just type \`help\`.`,
    );
  });
}
