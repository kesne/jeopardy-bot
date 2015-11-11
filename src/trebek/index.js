import requireDir from 'require-dir';
import {lock, unlock} from './locks';
import {clean} from './utils';

const commandObject = requireDir('./commands');
const commands = Object.keys(commandObject)
  .map(key => commandObject[key])
  .filter(n => typeof n === 'function');

export default async function(input, data = {}, customSay = false) {
  input = clean(input);

  let Command;
  let command;
  for (Command of commands) {
    command = new Command(input, data);
    if (command.valid) {
      break;
    }
  }

  if (!command) {
    return null;
  }

  // Some commands don't need locks, so don't waste our time with them:
  if (!Command.nolock) {
    await lock(data.channel_id);
  }

  let returnValue = null;
  try {
    await command.start(customSay);
    returnValue = command.message;
  } catch (e) {
    // Log all errors, at the risk of being noisy:
    console.log(e);
    console.log(e.stack);
  } finally {
    if (!Command.nolock) {
      await unlock(data.channel_id);
    }
  }

  return returnValue;
}
