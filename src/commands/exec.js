import fetch from 'node-fetch';
import * as commands from './commands';
import * as config from '../config';

function sendToSlack(message, url) {
  const body = {
    token: config.API_KEY,
    username: config.USERNAME,
    text: message,
    as_user: true
  };

  if (url) {
    body.attachments = [{
      fallback: 'Jeopardy Bot',
      image_url: url,
      color: '#F4AC79'
    }];
  }

  return fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
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
