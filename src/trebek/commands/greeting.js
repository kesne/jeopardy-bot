import Command from '../Command';
import { When, Feature, Provide, NoLock } from '../utils';

@NoLock
@When(
  'channel_join',
  'room_enter'
)
@Feature('greetings')
@Provide('contestant')
export default class Greeting extends Command {
  async response() {
    this.say(`Welcome to <#${this.studio.id}>, <@${this.contestant.slackid}>! To learn how to play, just type \`help\`.`);
  }
}
