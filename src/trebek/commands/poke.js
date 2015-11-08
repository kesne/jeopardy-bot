import Command from '../Command';
import {Trigger} from '../utils';

@Trigger('poke')
export default class Poke extends Command {
  response() {
    this.say(`I'm here, I'm here...`);
  }
}
