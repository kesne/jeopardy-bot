import Command from '../Command';
import {Trigger, Only, Provide} from '../utils';
import {boardImage, captureCluesForGame} from '../../cola';

@Trigger('new game')
@Only('gameinactive')
@Provide('game')
class NewGame extends Command {
  async response() {
    this.sayOptional('Starting a new game for you...');

    // Start the game:
    const game = await this.models.Game.start({
      channel_id: this.data.channel_id,
      channel_name: this.data.channel_name
    });

    const url = await boardImage({game});

    // Kick off clue capturing. We don't await this because we want it to happen in the background.
    captureCluesForGame({game});

    this.say(`Let's get this game started! Go ahead and select a category and value.`, url);
  }
}

export default NewGame;
