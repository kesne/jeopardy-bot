import fetch from 'node-fetch';
import * as commands from './commands';
import * as config from '../config';

function sendToSlack(message, url) {
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
    send(message, url) {
      if (config.MODE === 'response') {
        response += `${message} ${url}`;
      } else {
        sendToSlack(message, url);
      }
    }
  }, info);
  return response;
}
