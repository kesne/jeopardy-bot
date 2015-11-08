import requireDir from 'require-dir';
import {lock, unlock} from './locks';

const commandObject = requireDir('./commands');
const commands = Object.keys(commandObject)
  .map(key => commandObject[key])
  .filter(n => typeof n === 'function');

export default async function(input, data = {}) {
  input = input.toLowerCase();
  const command = commands.find(Command => {
    const command = new Command(input, data);
    if (command.valid) {
      return command;
    }
  });

  if (!command) {
    return null;
  }

  lock(data.channel_id);

  let returnValue = null;
  try {
    await command.promise;
    returnValue = command.message;
  } finally {
    unlock(data.channel_id);
  }

  return returnValue;
}
