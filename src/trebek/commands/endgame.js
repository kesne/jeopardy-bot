import Command from '../Command';
import { Trigger, Only, Feature, Provide } from '../utils';

@Trigger('end game')
@Only('gameactive')
@Feature('endGame')
@Provide('game')
export default class EndGame extends Command {
  async response() {
    // Try to end the game:
    await this.game.end();
    this.say('Alright, I\'ve ended that game for you. You can always start a new game by typing "new game".');
  }
}
