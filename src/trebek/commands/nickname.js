import Command from '../Command';
import { Trigger, NoLock, Provide } from '../utils';

@NoLock
@Trigger(
  /call me ([^\s]+)/
)
@Provide('contestant')
class Help extends Command {
  async response([nickname]) {
    this.contestant.nickname = nickname;
    await this.contestant.save();
    this.say(`Okay, I'll call you "${nickname}" when I'm not mentioning you.`);
  }
}

export default Help;
