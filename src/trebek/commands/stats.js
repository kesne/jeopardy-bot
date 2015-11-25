import Command from '../Command';
import {Trigger, Provide, NoLock, currency} from '../utils';

@NoLock
@Trigger(/stats?( [A-Z0-9.\-_]+)?/)
@Provide('contestant')
export default class Stats extends Command {
  async response([name]) {
    let contestant = this.contestant;
    if (name) {
      contestant = await this.models.Contestant.findOne({
        name
      });
    }
    const score = contestant.channelScore(this.body.channel_id).value;
    
    this.say(`Stats for *@${contestant.name}*:
> _${currency(score)} current game_ *|* _${currency(contestant.stats.money)} total_ *|* _${contestant.stats.won} wins_ *|* _${contestant.stats.lost} losses`);
  }
}
