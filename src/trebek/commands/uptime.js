import Command from '../Command';
import { Trigger, NoLock } from '../utils';
import moment from 'moment';

@NoLock
@Trigger(
  /(?:whats )?uptime/
)
export default class Poke extends Command {
  response() {
    const uptime = moment().subtract(process.uptime(), 'seconds').toNow(true);
    this.say(
      `:robot_face: I am a humble JeopardyBot. I have been running for ${uptime}.`
    );
  }
}
