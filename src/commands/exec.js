import * as commands from './commands';

export default async function exec(message) {
  return commands[message.command](message);
};
