import Command from '../Command';
import { Trigger, NoLock } from '../utils';

function formatUptime(inputUptime) {
  let uptime = inputUptime;
  let unit = 'second';
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'minute';
  }
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'hour';
  }
  if (uptime !== 1) {
    unit = unit + 's';
  }

  uptime = uptime.toFixed(3) + ' ' + unit;
  return uptime;
}

@NoLock
@Trigger('uptime')
export default class Poke extends Command {
  response() {
    const uptime = formatUptime(process.uptime());
    this.say(
      `:robot_face: I am a bot named <@${this.app.username}>. I have been running for ${uptime}.`
    );
  }
}
