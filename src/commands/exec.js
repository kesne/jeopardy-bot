import fetch from 'node-fetch';
import * as commands from './commands';
import * as config from '../config';

var FormData = require('form-data');

function sendToSlack(channel, message, url) {
  const form = new FormData();
  form.append('token', config.API_TOKEN);
  form.append('username', config.USERNAME);
  form.append('text', message);
  form.append('channel', channel);
  form.append('as_user', JSON.stringify(true));

  if (url) {
    form.append('attachments', JSON.stringify([{
      fallback: 'Jeopardy Bot',
      image_url: url,
      color: '#F4AC79'
    }]));
  }

  return fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    body: form
  }).then((msg) => {
    msg.text().then(text => {
      console.log('harro', text);
    })
  }, (e) => {
    console.error(e.stack);
  });
}

export async function exec(info) {
  let response = '';
  await commands[info.command].call({
    async send(message, url = '') {
      if (config.MODE === 'response') {
        response += `${message} ${url}\n`;
      } else {
        await sendToSlack(info.body.channel_id, message, url);
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
