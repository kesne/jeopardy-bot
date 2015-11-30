import Command from '../Command';
import { Trigger, NoLock } from '../utils';

@NoLock
@Trigger('poke')
export default class Poke extends Command {
  response() {
    this.say(`I'm here, I'm here...`);
  }
}
