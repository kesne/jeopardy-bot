import Command from '../Command';
import { NoLock, Trigger, Feature, Provide, currency } from '../utils';

@NoLock
@Trigger(/stats?(?: ([A-Z0-9.\-_]+))?/)
@Feature('stats')
@Provide('contestant')
export default class Stats extends Command {
  async response([name]) {
    let contestant = this.contestant;
    if (name) {
      contestant = await this.models.Contestant.findOne({
        name,
      });
      // Handle bad input:
      if (!contestant) {
        return;
      }
    }
    const score = contestant.channelScore(this.data.channel_id).value;

    this.say(`Stats for *<@${contestant.id}>*:
> _${currency(score)} current game_ *|* _${currency(contestant.stats.money)} total_ *|* _${contestant.stats.won} wins_ *|* _${contestant.stats.lost} losses_`);
  }
}
