import requireDir from 'require-dir';
import App from '../models/App';
import { channels, post } from './slack';
import { lock, unlock } from './locks';
import { clean } from './utils';
import winston from 'winston';

const commandObject = requireDir('./commands');
const commands = Object.keys(commandObject)
  .map(key => commandObject[key])
  .filter(n => typeof n === 'function');

export async function broadcast(message, channel) {
  const app = await App.get();
  if (app.hasApi()) {
    if (!channel) {
      const list = await channels();
      list.forEach(c => {
        post(c.id, message);
      });
    } else {
      post(channel, message);
    }
  }
}

export default async function(input, data = {}, say) {
  const cleanInput = clean(input);

  let Command;
  let command;
  // TODO: Due to a timing issue, this is not ideal. We end up booting up the command before the lock
  // completes. So to combat that, we need to move more logic into start so that only the metadata is
  // evaluated when we new up the Command.
  for (Command of commands) {
    command = new Command(cleanInput, data);
    if (command.valid) {
      break;
    }
  }

  if (!command.valid) {
    return null;
  }

  // Use a custom say command:
  command.useSay(say);

  // Some commands don't need locks, so don't waste our time with them:
  if (!Command.nolock) {
    await lock(data.channel_id);
  }

  try {
    await command.start();
  } catch (e) {
    // Log all errors, at the risk of being noisy:
    winston.error(e);
  } finally {
    if (!Command.nolock) {
      await unlock(data.channel_id);
    }
  }
}
