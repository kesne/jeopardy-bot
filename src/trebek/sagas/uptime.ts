import moment from 'moment';
import { input, say } from './utils';

export default function* uptime() {
  yield input('uptime', function*() {
    const uptime = moment()
      .subtract(process.uptime(), 'seconds')
      .toNow(true);

    yield say(
      `:robot_face: I am a humble JeopardyBot. I have been running for ${uptime}.`,
    );
  });
}
