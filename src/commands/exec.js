import fetch from 'node-fetch';
import * as commands from './commands';
import * as config from '../config';

function sendToSlack(message, url) {
  return console.log('Sending: ', message);
  // TODO:
  return fetch('https://sack.com/api/chat.postMessage', {
    body: {
      token: config.API_KEY
    }
  });
}

export async function exec(info) {
  let response = '';
  await commands[info.command].call({
    async send(message, url = '') {
      if (config.MODE === 'response') {
        response += `${message} ${url}\n`;
      } else {
        await sendToSlack(message, url);
      }
    },
    // You can use this to send optional bits of information that will be sent by the bot:
    sendOptional(...args) {
      if (config.MODE !== 'response') {
        return this.send(...args);
      }
    }
  }, info);
  return response;
}
