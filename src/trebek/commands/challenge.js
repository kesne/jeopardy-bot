import Command from '../Command';
import {Trigger, Only} from '../utils';

@Trigger(
  /(challenge)|(y)|(n)/
)
@Only(
  'gameactive',
  'noclue'
)
export default class Challenge extends Command {
  async response([challenge, yes, no]) {

  }
}
