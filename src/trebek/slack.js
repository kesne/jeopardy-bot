import fetch from 'node-fetch';
import FormData from 'form-data';
import App from '../models/App';

export async function channels() {
  const app = await App.get();

  const form = new FormData();
  form.append('token', app.apiToken);
  form.append('username', app.username);

  const data = await fetch('https://slack.com/api/channels.list', {
    method: 'post',
    body: form,
  }).then(res => res.json());

  return data.channels.filter(channel => channel.is_member);
}

export async function post(channel, message, url) {
  const app = await App.get();

  const form = new FormData();
  form.append('token', app.apiToken);
  form.append('username', app.username);
  // TODO: Icon emoji?
  form.append('text', message);
  form.append('channel', channel);
  form.append('as_user', JSON.stringify(true));

  if (url) {
    form.append('attachments', JSON.stringify([{
      fallback: 'Jeopardy Bot',
      image_url: url,
      color: '#F4AC79',
    }]));
  }

  return fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    body: form,
  });
}
